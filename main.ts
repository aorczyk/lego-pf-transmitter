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

    function splitToBulks(arr: string[], bulkSize = 20) {
        const bulks = [];
        for (let i = 0; i < Math.ceil(arr.length / bulkSize); i++) {
            bulks.push(arr.slice(i * bulkSize, (i + 1) * bulkSize));
        }
        return bulks;
    }

    function bin_to_dec(bstr: number) {
        return parseInt((bstr + ''), 2);
    }

    function createBinaryString(nMask: number) {
        let nShifted = nMask,
            sMask = "";
        for (let nFlag = 0; nFlag < 32; nFlag++, sMask += (nShifted >>> 31).toString(), nShifted <<= 1);
        return sMask.slice(16);
    }

    class InfraredLed {
        private pin: AnalogPin;
        private waitCorrection: number;
        private toggleByChannel: number[] = [1, 1, 1, 1];
        private messageLength: number;

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

                serial.writeNumbers([end - start,this.waitCorrection])
            }

            // Insert a pause between callibration and first message
            control.waitMicros(2000);
        }

        public transmitBit(highMicros: number, lowMicros: number): void {
            this.messageLength += highMicros + lowMicros;

            pins.analogWritePin(this.pin, 511);
            control.waitMicros(highMicros);
            pins.analogWritePin(this.pin, 1);
            control.waitMicros(lowMicros);
        }

        public sendDatagram(esc: number, channel: number, address: number, mode: number, data: number): void {
            esc = bin_to_dec(esc);
            channel = bin_to_dec(channel);
            address = bin_to_dec(address);
            mode = bin_to_dec(mode);
            data = bin_to_dec(data);

            this.messageLength = 0;
            this.toggleByChannel[channel] = 1 - this.toggleByChannel[channel];

            let nibble1 = (this.toggleByChannel[channel] << 3) | (esc << 2) | channel;
            let nibble2 = (address << 3) | mode;
            let lrc = 15 ^ nibble1 ^ nibble2 ^ data;

            let out = (nibble1 << 12) | (nibble2 << 8) | (data << 4) | lrc;

            let bits = createBinaryString(out).split('');

            const PF_MARK_BIT = 158;
            const PF_LOW_BIT = 421 - PF_MARK_BIT - this.waitCorrection;
            const PF_HIGH_BIT = 711 - PF_MARK_BIT - this.waitCorrection;
            const PF_START_BIT = 1184 - PF_MARK_BIT - this.waitCorrection;

            let start = input.runningTimeMicros();

            this.transmitBit(PF_MARK_BIT, PF_START_BIT);

            bits.forEach((bit) => {
                if (bit == '0') {
                    this.transmitBit(PF_MARK_BIT, PF_LOW_BIT);
                } else if (bit == '1') {
                    this.transmitBit(PF_MARK_BIT, PF_HIGH_BIT);
                }
            })

            this.transmitBit(PF_MARK_BIT, PF_START_BIT);

            if (debug) {
                serial.writeNumbers([this.messageLength / 1000, (input.runningTimeMicros() - start) / 1000])
                serial.writeString(JSON.stringify(splitToBulks(bits, 4)) + "\n")
            }
        }
    }

    // --- Command sender ---
    // To achieve greater parallelization of signals, mixes ir signals when more than one command is run one by one.
    
    let isWorking: boolean = false;
    let tasks: task[] = [];
    let tasksTypes: number[] = [];

    function getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    interface task {
        channel: number;
        output: number;
        handler: () => void;
    }

    function send(channel: number, output: number, handler: () => void) {
        let taskType = channel << 1 | output;

        while (tasksTypes.indexOf(taskType) != -1){
            basic.pause(20)
        }

        for (let i = 0; i <= 3; i++) {
            tasks.push({ channel: channel, output: output, handler: handler})
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

    export function sendPf(): void {
        // // irLed.sendDatagram(0, 0, 0, 1, 101);
        // irLed.sendDatagram(0, 0, 0, 100, 111);
        // irLed.sendDatagram(0, 0, 0, 101, 111);
        // basic.pause(1000);
        // irLed.sendDatagram(0, 0, 0, 100, 1000);
        // irLed.sendDatagram(0, 0, 0, 101, 1000);
        // // irLed.sendPf(0, 0, 0, 1, 101);

        send(0, 0, () => irLed.sendDatagram(0, 0, 0, 100, 111))
        send(0, 1, () => irLed.sendDatagram(0, 0, 0, 101, 111))
        // schedule(1, 0, () => irLed.sendDatagram(0, 1, 0, 100, 111))
        // schedule(1, 1, () => irLed.sendDatagram(0, 1, 0, 101, 111))
        // schedule(0, 0, () => irLed.sendDatagram(0, 0, 0, 100, 1000))

        basic.pause(500);

        send(0, 0, () => irLed.sendDatagram(0, 0, 0, 100, 1000))
        send(0, 1, () => irLed.sendDatagram(0, 0, 0, 101, 1000))

    }
}

pfTransmitter.connectIrSenderLed(AnalogPin.P0)
pfTransmitter.debug = true;

input.onButtonPressed(Button.A, function () {
    pfTransmitter.sendPf()
})