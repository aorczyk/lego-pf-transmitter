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

        public sendDatagram(esc: number, channel: number, address: number, mode: number, data: number): void {
            esc = esc;
            channel = channel;
            address = address;
            mode = mode;
            data = data;

            this.toggleByChannel[channel] = 1 - this.toggleByChannel[channel];

            let nibble1 = (this.toggleByChannel[channel] << 3) | (esc << 2) | channel;
            let nibble2 = (address << 3) | mode;
            let lrc = 15 ^ nibble1 ^ nibble2 ^ data;

            let out = (nibble1 << 12) | (nibble2 << 8) | (data << 4) | lrc;

            const PF_MARK_BIT = 158;
            const PF_LOW_BIT = 421 - PF_MARK_BIT - this.waitCorrection;
            const PF_HIGH_BIT = 711 - PF_MARK_BIT - this.waitCorrection;
            const PF_START_BIT = 1184 - PF_MARK_BIT - this.waitCorrection;

            let bits = [];

            this.transmitBit(PF_MARK_BIT, PF_START_BIT);

            for (let i = 15; i >= 0; i--){
                let bit = (out & (1 << i)) === 0 ? 0 : 1;

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

    function sendPacket(esc: number, channel: number, address: number, mode: number, data: number){
        for (let i = 0; i <= 3; i++) {
            irLed.sendDatagram(esc, channel, address, mode, data)
        }
    }

    function sendMixedPackets(esc: number, channel: number, address: number, mode: number, data: number) {
        let taskType = channel << 1 | (0b001 & mode);

        while (tasksTypes.indexOf(taskType) != -1){
            basic.pause(20)
        }

        for (let i = 0; i <= 3; i++) {
            tasks.push({ handler: () => {
                irLed.sendDatagram(esc, channel, address, mode, data)
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
        let data = 0b0001111 & command;
        let mode = (command >>> 4) | output;
        sendMixedPackets(0, channel, 0, mode, data)
    }

    export function sendPf(): void {
        // // irLed.sendDatagram(0, 0, 0, 1, 101);
        // irLed.sendDatagram(0, 0, 0, 100, 111);
        // irLed.sendDatagram(0, 0, 0, 101, 111);
        // basic.pause(1000);
        // irLed.sendDatagram(0, 0, 0, 100, 1000);
        // irLed.sendDatagram(0, 0, 0, 101, 1000);
        // // irLed.sendPf(0, 0, 0, 1, 101);

        sendMixedPackets(0, 0b0, 0, 0b100, 0b111)
        sendMixedPackets(0, 0b0, 0, 0b101, 0b111)
        // schedule(1, 0, () => irLed.sendDatagram(0, 0b1, 0, 0b100, 0b111))
        // schedule(1, 1, () => irLed.sendDatagram(0, 0b1, 0, 0b101, 0b111))
        // schedule(0, 0, () => irLed.sendDatagram(0, 0b0, 0, 0b100, 0b1000))

        basic.pause(1000);
        serial.writeString("--- pause ---\n")

        sendMixedPackets(0, 0, 0, 0b100, 0b1000)
        sendMixedPackets(0, 0, 0, 0b101, 0b1000)

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

pfTransmitter.connectIrSenderLed(AnalogPin.P0)
pfTransmitter.debug = true;

input.onButtonPressed(Button.A, function () {
    pfTransmitter.speedRc(0, 0, speedCommand.Forward_1)
    pfTransmitter.speedRc(0, 1, speedCommand.Forward_1)
    basic.pause(1000);
    pfTransmitter.speedRc(0, 0, speedCommand.Forward_2)
    pfTransmitter.speedRc(0, 1, speedCommand.Forward_2)
    basic.pause(1000);
    pfTransmitter.speedRc(0, 0, speedCommand.Forward_3)
    pfTransmitter.speedRc(0, 1, speedCommand.Forward_3)
    basic.pause(1000);
    pfTransmitter.speedRc(0, 0, speedCommand.Forward_4)
    pfTransmitter.speedRc(0, 1, speedCommand.Forward_4)
    basic.pause(1000);
    pfTransmitter.speedRc(0, 0, speedCommand.Forward_5)
    pfTransmitter.speedRc(0, 1, speedCommand.Forward_5)
    basic.pause(1000);
    pfTransmitter.speedRc(0, 0, speedCommand.Forward_6)
    pfTransmitter.speedRc(0, 1, speedCommand.Forward_6)
    basic.pause(1000);
    pfTransmitter.speedRc(0, 0, speedCommand.Forward_7)
    pfTransmitter.speedRc(0, 1, speedCommand.Forward_7)
    basic.pause(1000);
    pfTransmitter.speedRc(0, 0, speedCommand.Float)
    pfTransmitter.speedRc(0, 1, speedCommand.Float)
    // pfTransmitter.sendPf()
    // pfTransmitter.speedRc(0, 0, speedCommand.Forward_7)
    // pfTransmitter.speedRc(0, 1, speedCommand.Forward_7)
    // basic.pause(1000);
    // pfTransmitter.speedRc(0, 0, speedCommand.Float)
    // pfTransmitter.speedRc(0, 1, speedCommand.Float)
})

input.onButtonPressed(Button.B, function () {
    // pfTransmitter.speedRc(0, 0, speedCommand.Full_backward)
})