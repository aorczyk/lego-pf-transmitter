/**
 * TODO
 * - ponawianie tej samej wiadomości (nadajnik ponawia 4x) ?
 * - scheduler - prawidłowe odstępy pomiędzy kolejnymi poleceniami (tak w moim wrapperze)
 */

/**
 * MakerBit
 */
//% color=#0fbc11 icon="\u272a" block="MakerBit"
//% category="MakerBit"
namespace makerbit {
    let irLed: InfraredLed;
    let scheduler: Scheduler;
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
        private toggleBit: number;
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

        public sendPfDatagram(esc: number, channel: number, address: number, mode: number, data: number): void {
            esc = bin_to_dec(esc);
            channel = bin_to_dec(channel);
            address = bin_to_dec(address);
            mode = bin_to_dec(mode);
            data = bin_to_dec(data);

            this.messageLength = 0;

            let nibble1 = (this.toggleBit << 3) | (esc << 2) | channel;
            let nibble2 = (address << 3) | mode;
            let lrc = 15 ^ nibble1 ^ nibble2 ^ data;

            // let out = (((nibble1 << 4) + nibble2 << 4) + data << 4) + lrc;
            let out = (nibble1 << 12) | (nibble2 << 8) | (data << 4) | lrc;

            let bits = createBinaryString(out).split('');

            const PF_MARK_BIT = 158;
            const PF_LOW_BIT = 421 - PF_MARK_BIT;
            const PF_HIGH_BIT = 711 - PF_MARK_BIT;
            const PF_START_BIT = 1184 - PF_MARK_BIT;

            this.transmitBit(PF_MARK_BIT, PF_START_BIT);

            bits.forEach((bit) => {
                if (bit == '0') {
                    this.transmitBit(PF_MARK_BIT, PF_LOW_BIT);
                } else if (bit == '1') {
                    this.transmitBit(PF_MARK_BIT, PF_HIGH_BIT);
                }
            })

            this.transmitBit(PF_MARK_BIT, PF_START_BIT);

            // let pasue = Math.floor(4 * this.messageLength / 1000);
            let pasue = 20;
            if (debug) {
                console.log(JSON.stringify(splitToBulks(bits, 4)))
                console.log(this.messageLength)
                console.log(pasue)
            }

            basic.pause(pasue)
        }
    }

    class Scheduler {
        // --- IR signal delays ---
        // Minimal delay every ir signal
        private irSignalDelay: number;
        // Minimal delay every signal to specified channel
        private irChannelSignalDelay: number;
        // Minimal delay every signal to specified channel output (red or blue)
        private irOutputSignalDelay: number;

        private channels: number[][] = [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
        ];

        private irLastSignalTime: number = 0;
        private channelsIr: number[] = [0, 0, 0, 0];
        private scheduledEvents: number = 0;

        constructor(irSignalDelay: number = 20, irChannelSignalDelay: number = 20, irOutputSignalDelay: number = 600,) {
            this.irSignalDelay = irSignalDelay;
            this.irChannelSignalDelay = irChannelSignalDelay;
            this.irOutputSignalDelay = irOutputSignalDelay;
        }

        schedule(channel: number, output: number, handler: () => void) {
            if (this.scheduledEvents > 6) {
                while (this.scheduledEvents > 7) {
                    basic.pause(20);
                }
            }

            this.scheduledEvents += 1;

            let time = input.runningTime();

            let scheduleTime = [
                this.irLastSignalTime + this.irSignalDelay,
                this.irChannelSignalDelay + this.channelsIr[channel],
                this.irOutputSignalDelay + this.channels[channel][output],
                time
            ].sort(function compareNumbers(a, b) {
                return b - a
            })[0];

            this.irLastSignalTime = scheduleTime;
            this.channelsIr[channel] = scheduleTime;
            this.channels[channel][output] = scheduleTime;

            let pauseTime = scheduleTime - time;

            control.inBackground(() => {
                if (pauseTime > 0) {
                    basic.pause(pauseTime)
                }

                this.scheduledEvents -= 1;

                handler();
            })
        }
    }

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
        scheduler = new Scheduler();
    }

    export function sendPf(): void {
        // // irLed.sendPfDatagram(0, 0, 0, 1, 101);
        // irLed.sendPfDatagram(0, 0, 0, 100, 111);
        // irLed.sendPfDatagram(0, 0, 0, 101, 111);
        // basic.pause(1000);
        // irLed.sendPfDatagram(0, 0, 0, 100, 1000);
        // irLed.sendPfDatagram(0, 0, 0, 101, 1000);
        // // irLed.sendPf(0, 0, 0, 1, 101);

        scheduler.schedule(0, 0, () => irLed.sendPfDatagram(0, 0, 0, 100, 111))
        scheduler.schedule(0, 1, () => irLed.sendPfDatagram(0, 0, 0, 101, 111))
        basic.pause(1000);
        scheduler.schedule(0, 0, () => irLed.sendPfDatagram(0, 0, 0, 100, 1000))
        scheduler.schedule(0, 1, () => irLed.sendPfDatagram(0, 0, 0, 101, 1000))
    }
}

makerbit.connectIrSenderLed(AnalogPin.P0)
makerbit.debug = true;

input.onButtonPressed(Button.A, function () {
    makerbit.sendPf()
})