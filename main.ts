/**
 * TODO
 * - ponawianie tej samej wiadomości (nadajnik ponawia 4x) ?
 * - scheduler - prawidłowe odstępy pomiędzy kolejnymi poleceniami (tak w moim wrapperze)
 */

/**
 * MakerBit
 */
//% color=#0fbc11 icon="\u272a" block="PF Transmitter"
namespace pfTransmitter {
    let irLed: InfraredLed;
    export let debug: boolean = false;

    function splitToBulks(arr: number[], bulkSize = 20) {
        const bulks = [];
        for (let i = 0; i < Math.ceil(arr.length / bulkSize); i++) {
            bulks.push(arr.slice(i * bulkSize, (i + 1) * bulkSize));
        }
        return bulks;
    }

    function setInterval(handler: () => {}, time: number){
        control.runInBackground(function(){
            while(true){
                let out = handler();
                if (out){
                    break;
                }
                basic.pause(time)
            }
        })
    }

    class InfraredLed {
        private pin: AnalogPin;
        private waitCorrection: number;
        private toggleByChannel: number[] = [1, 1, 1, 1];

        constructor(pin: AnalogPin) {
            this.pin = pin;
            pins.analogWritePin(this.pin, 0);
            pins.analogSetPeriod(this.pin, 26);

            // Measure the time we need for a minimal bit (analogWritePin and waitMicros)
            {
                const start = input.runningTimeMicros();
                const runs = 32;
                for (let i = 0; i < runs; i++) {
                    this.transmitBit(1, 1);
                }
                const end = input.runningTimeMicros();
                this.waitCorrection = Math.idiv(end - start - runs * 2, runs * 2);
            }

            // Insert a pause between callibration and first message
            control.waitMicros(2000);
        }

        public transmitBit(highMicros: number, lowMicros: number): void {
            pins.analogWritePin(this.pin, 511);
            control.waitMicros(highMicros);
            pins.analogWritePin(this.pin, 1);
            control.waitMicros(lowMicros);
        }

        // 12 bits of datagram
        public sendCommand(command: number) {
            let channel = (0b001100000000 & command) >>> 8;
            this.toggleByChannel[channel] = 1 - this.toggleByChannel[channel];

            command = (this.toggleByChannel[channel] << 11) | command;
            let nibble1 = command >>> 8;
            let nibble2 = (command & 0b000011110000) >>> 4;
            let nibble3 = (command & 0b000000001111);
            let lrc = 15 ^ nibble1 ^ nibble2 ^ nibble3;

            this.sendDatagram((command << 4) | lrc)
        }

        public sendDatagram(datagram: number): void {
            const PF_MARK_BIT = 158;
            const PF_LOW_BIT = 421 - PF_MARK_BIT - this.waitCorrection;
            const PF_HIGH_BIT = 711 - PF_MARK_BIT - this.waitCorrection;
            const PF_START_BIT = 1184 - PF_MARK_BIT - this.waitCorrection;

            let bits = [];

            this.transmitBit(PF_MARK_BIT, PF_START_BIT);

            for (let i = 15; i >= 0; i--){
                let bit = (datagram & (1 << i)) === 0 ? 0 : 1;

                bits.push(bit);

                if (bit == 0) {
                    this.transmitBit(PF_MARK_BIT, PF_LOW_BIT);
                } else if (bit == 1) {
                    this.transmitBit(PF_MARK_BIT, PF_HIGH_BIT);
                }
            }

            this.transmitBit(PF_MARK_BIT, PF_START_BIT);

            if (debug) {
                serial.writeString(JSON.stringify(splitToBulks(bits, 4)) + "\n")
            }
        }
    }

    // --- Command sender ---
    // To achieve greater parallelization of signals, mixes ir signals when more than one command is run one by one.
    
    interface task {
        handler: () => void;
    }

    let isWorking: boolean = false;
    let tasks: task[] = [];
    let tasksTypes: number[] = [];

    function getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function sendPacket(command: number){
        for (let i = 0; i <= 3; i++) {
            irLed.sendCommand(command)
        }
    }

    function sendMixedPackets(command: number) {
        let taskType = 0b001100110000 & command;

        while (tasksTypes.indexOf(taskType) != -1){
            basic.pause(20)
        }

        for (let i = 0; i <= 3; i++) {
            tasks.push({ handler: () => {
                irLed.sendCommand(command)
            }})
            tasksTypes.push(taskType);
        }

        if (!isWorking){
            isWorking = true;

            control.inBackground(function() {
                while(tasks.length > 0){
                    let i = getRandomInt(0, tasks.length - 1);
                    let task = tasks[i];
                    tasks.splice(i, 1);
                    tasksTypes.splice(i, 1);
                    task.handler();
                }
                isWorking = false;
            })
        }
    }

    // ---

    /**
     * Connects to the IR-emitting LED at the specified pin.
     * @param pin IR LED pin, eg: AnalogPin.P0
     */
    //% subcategory="IR Sender"
    //% blockId="makerbit_infrared_sender_connect"
    //% block="connect IR sender LED at pin %pin"
    //% pin.fieldEditor="gridpicker"
    //% pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false"
    //% weight=90
    export function connectIrSenderLed(pin: AnalogPin): void {
        irLed = new InfraredLed(pin);
    }

    export function speedRc(channel: number, output: number, command: number){
        sendMixedPackets(((channel >>> 2) << 8) | command | (output << 4))
    }

    let lastCommand: number[] =[0, 0, 0, 0];

    export function rc(channel: number, red: number, blue: number){
        let command: number = (blue << 2) | red;
        let datagram = ((channel >>> 2) << 8) | 0b00010000 | command;
        lastCommand[channel] = command;

        setInterval(()=>{
            if (command == lastCommand[channel]){
                sendPacket(datagram);

                if (command == 0){
                    return true;
                }
                return false;
            }
            return true;
        }, 1000)
    }
}

enum speedCommand {
    'Float' = 0b1000000,
    'Forward_1' = 0b1000001,
    'Forward_2' = 0b1000010,
    'Forward_3' = 0b1000011,
    'Forward_4' = 0b1000100,
    'Forward_5' = 0b1000101,
    'Forward_6' = 0b1000110,
    'Forward_7' = 0b1000111,
    'Brake then float' = 0b1000111,
    'Backward_7' = 0b1001001,
    'Backward_6' = 0b1001010,
    'Backward_5' = 0b1001011,
    'Backward_4' = 0b1001100,
    'Backward_3' = 0b1001101,
    'Backward_2' = 0b1001110,
    'Backward_1' = 0b1001111,
    'Increment_PWM' = 0b1100100,
    'Decrement_PWM' = 0b1100101,
    'Full_forward' = 0b1100110,
    'Full_backward' = 0b1100111,
}

enum rcCommand {
    'Float' = 0b00,
    'Forward' = 0b01,
    'Backward' = 0b10,
    'Brake_then_float' = 0b11,
}

pfTransmitter.connectIrSenderLed(AnalogPin.P0)
pfTransmitter.debug = true;

input.onButtonPressed(Button.A, function () {
    // pfTransmitter.speedRc(0, 0, speedCommand.Forward_1)
    // pfTransmitter.speedRc(0, 1, speedCommand.Forward_1)
    // basic.pause(1000);
    // pfTransmitter.speedRc(0, 0, speedCommand.Forward_2)
    // pfTransmitter.speedRc(0, 1, speedCommand.Forward_2)
    // basic.pause(1000);
    // pfTransmitter.speedRc(0, 0, speedCommand.Forward_3)
    // pfTransmitter.speedRc(0, 1, speedCommand.Forward_3)
    // basic.pause(1000);
    // pfTransmitter.speedRc(0, 0, speedCommand.Forward_4)
    // pfTransmitter.speedRc(0, 1, speedCommand.Forward_4)
    // basic.pause(1000);
    // pfTransmitter.speedRc(0, 0, speedCommand.Forward_5)
    // pfTransmitter.speedRc(0, 1, speedCommand.Forward_5)
    // basic.pause(1000);
    // pfTransmitter.speedRc(0, 0, speedCommand.Forward_6)
    // pfTransmitter.speedRc(0, 1, speedCommand.Forward_6)
    // basic.pause(1000);
    // pfTransmitter.speedRc(0, 0, speedCommand.Forward_7)
    // pfTransmitter.speedRc(0, 1, speedCommand.Forward_7)
    // basic.pause(1000);
    // pfTransmitter.speedRc(0, 0, speedCommand.Float)
    // pfTransmitter.speedRc(0, 1, speedCommand.Float)

    pfTransmitter.rc(0, rcCommand.Forward, rcCommand.Forward)
})

input.onButtonPressed(Button.B, function () {
    pfTransmitter.rc(0, rcCommand.Float, rcCommand.Float)
    // pfTransmitter.speedRc(0, 0, speedCommand.Full_backward)
})