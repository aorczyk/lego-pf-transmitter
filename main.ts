const enum Channel {
    //% block="1"
    Channel1 = 0,
    //% block="2"
    Channel2 = 1,
    //% block="3"
    Channel3 = 2,
    //% block="4"
    Channel4 = 3,
}

const enum Output {
    Red = 0,
    Blue = 1
}

const enum SingleOutput {
    //% block="Float"
    Float = 0b1000000,
    //% block="Forward 1"
    Forward1 = 0b1000001,
    //% block="Forward 2"
    Forward2 = 0b1000010,
    //% block="Forward 3"
    Forward3 = 0b1000011,
    //% block="Forward 4"
    Forward4 = 0b1000100,
    //% block="Forward 5"
    Forward5 = 0b1000101,
    //% block="Forward 6"
    Forward6 = 0b1000110,
    //% block="Forward 7"
    Forward7 = 0b1000111,
    //% block="Brake then float"
    BrakeThenFloat = 0b1000111,
    //% block="Backward 7"
    Backward7 = 0b1001001,
    //% block="Backward 6"
    Backward6 = 0b1001010,
    //% block="Backward 5"
    Backward5 = 0b1001011,
    //% block="Backward 4"
    Backward4 = 0b1001100,
    //% block="Backward 3"
    Backward3 = 0b1001101,
    //% block="Backward 2"
    Backward2 = 0b1001110,
    //% block="Backward 1"
    Backward1 = 0b1001111,
    //% block="Increment PWM"
    IncrementPWM = 0b1100100,
    //% block="Decrement PWM"
    DecrementPWM = 0b1100101,
    //% block="Full forward"
    FullForward = 0b1100110,
    //% block="Full backward"
    FullBackward = 0b1100111,
}

const enum ComboDirect {
    //% block="Float"
    Float = 0b00,
    //% block="Forward"
    Forward = 0b01,
    //% block="Backward"
    Backward = 0b10,
    //% block="Brake then float"
    BrakeThenFloat = 0b11,
}

//% color=#f68420 icon="\uf1eb" block="PF Transmitter"
namespace pfTransmitter {
    let irLed: InfraredLed;
    export let debug: boolean = false;
    export let repeatCommandTime: number = 500;

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

    let packetCommand = null;
    function sendPacket(command: number){
        packetCommand = command;
        for (let i = 0; i <= 3; i++) {
            if (packetCommand == command){
                irLed.sendCommand(command);
                basic.pause(20);
            }
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
    //% blockId="pf_transmitter_infrared_sender_connect"
    //% block="connect IR sender LED at pin %pin"
    //% pin.fieldEditor="gridpicker"
    //% pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false"
    //% weight=90
    export function connectIrSenderLed(pin: AnalogPin): void {
        irLed = new InfraredLed(pin);
    }

    export function singleOutputMode(channel: Channel, output: Output, command: SingleOutput){
        lastCommand[channel] = null;
        sendMixedPackets((channel << 8) | command | (output << 4))
    }

    let lastCommand: number[] = [0, 0, 0, 0];

    export function comboDirectMode(channel: Channel, red: ComboDirect, blue: ComboDirect){
        let command: number = (blue << 2) | red;
        let datagram = (channel << 8) | 0b00010000 | command;

        if (command == lastCommand[channel]){
            return;
        }

        lastCommand[channel] = command;

        // setInterval(() => {
        //     if (command == lastCommand[channel]) {
        //         sendPacket(datagram);
        //         serial.writeNumbers([input.runningTime(), command])

        //         if (command == 0){
        //             return true;
        //         }
        //     } else {
        //         return true;
        //     }
        //     return false;
        // }, repeatCommandTime)


        sendPacket(datagram);

        if (command != 0) {
            let iId = control.setInterval(() => {
                if (command == lastCommand[channel]) {
                    sendPacket(datagram);
                    serial.writeNumbers([input.runningTime(), command])
                } else {
                    control.clearInterval(iId, control.IntervalMode.Interval)
                }
            }, repeatCommandTime, control.IntervalMode.Interval)
        }
    }

    const enum ComboPWM {
        //% block="Float"
        Float = 0b0000,
        //% block="Forward 1"
        Forward1 = 0b0001,
        //% block="Forward 2"
        Forward2 = 0b0010,
        //% block="Forward 3"
        Forward3 = 0b0011,
        //% block="Forward 4"
        Forward4 = 0b0100,
        //% block="Forward 5"
        Forward5 = 0b0101,
        //% block="Forward 6"
        Forward6 = 0b0110,
        //% block="Forward 7"
        Forward7 = 0b0111,
        //% block="Brake then float"
        BrakeThenFloat = 0b1000,
        //% block="Backward 7"
        Backward7 = 0b1001,
        //% block="Backward 6"
        Backward6 = 0b1010,
        //% block="Backward 5"
        Backward5 = 0b1011,
        //% block="Backward 4"
        Backward4 = 0b1100,
        //% block="Backward 3"
        Backward3 = 0b1101,
        //% block="Backward 2"
        Backward2 = 0b1110,
        //% block="Backward 1"
        Backward1 = 0b1111,
    }

    export function comboPWMMode(channel: Channel, red: ComboPWM, blue: ComboPWM) {
        let command: number = (blue << 4) | red;
        let datagram = ((0b0100 | channel) << 8) | command;

        if (command == lastCommand[channel]) {
            return;
        }

        lastCommand[channel] = command;

        sendPacket(datagram);

        if (command != 0) {
            let iId = control.setInterval(() => {
                if (command == lastCommand[channel]) {
                    sendPacket(datagram);
                } else {
                    control.clearInterval(iId, control.IntervalMode.Interval)
                }
            }, repeatCommandTime, control.IntervalMode.Interval)
        }
    }

    export function play(commands: number[][]){
        commands.forEach((task) => {
            let channel = (0b001100000000 & task[0]) >>> 8;
            let mode = (0b000001110000 & task[0]) >>> 4;

            if (mode == 1){
                let red  = (0b000000000011 & task[0]);
                let blue = (0b000000001100 & task[0]) >>> 2;
                comboDirectMode(channel, red, blue)
            } else {
                let output = (0b000000110000 & task[0]) >>> 4;
                let command = (0b000000001111 & task[0]);
                singleOutputMode(channel, output, command)
            }
            
            serial.writeNumbers([222, task[0], task[2], input.runningTimeMicros()])
            basic.pause(task[2])
        })
    }
}

// pfTransmitter.connectIrSenderLed(AnalogPin.P0)
// // pfTransmitter.debug = true;

// input.onButtonPressed(Button.A, function() {
//    pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Forward, ComboDirect.Float)
//    basic.pause(200);
//    pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Float, ComboDirect.Float)
// //    basic.clearScreen();
// })

