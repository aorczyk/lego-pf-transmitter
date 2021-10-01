pfTransmitter.connectIrSenderLed(AnalogPin.P0, false)

let test = 4;
let testMax = 4;
basic.showNumber(test)



// Tests:
// 0. singleOutputMode - two outputs in the same time: A - Increment, B - Decrement.
// 1. singleOutputMode - two outputs in the same time: A - on, B - off.
// 2. On and off: A - singleOutputMode, B - comboDirectMode.
// 3. Hold command for 10s (auto repeat): A - comboDirectMode, B - comboPWMMode.
// 4. singleOutputMode: increment and decrement (A - one output, B - two outputs).

input.onButtonPressed(Button.AB, function () {
    test += 1;

    if (test > testMax){
        test = 0
    }

    basic.showNumber(test)
})

input.onButtonPressed(Button.A, function () {
    if (test == 0){
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.IncrementPWM)
        pfTransmitter.singleOutputMode(0, 1, PfSingleOutput.IncrementPWM)
    } else if (test == 1){
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Forward7)
        pfTransmitter.singleOutputMode(0, 1, PfSingleOutput.Forward7)
    } else if (test == 2) {
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Forward7)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Float)
    } else if (test == 3) {
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Forward, PfComboDirect.Float)
        basic.pause(10000)
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Float, PfComboDirect.Float)
    } else if (test == 4) {
        for (let n = 0; n < 7; n++){
            pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.IncrementPWM)
        }
        for (let n = 7; n > 0; n--) {
            pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.DecrementPWM)
        }
    }
})

input.onButtonPressed(Button.B, function () {
    if (test == 0) {
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.DecrementPWM)
        pfTransmitter.singleOutputMode(0, 1, PfSingleOutput.DecrementPWM)
    } else if (test == 1) {
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Float)
        pfTransmitter.singleOutputMode(0, 1, PfSingleOutput.Float)
    } else if (test == 2) {
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Forward, PfComboDirect.Float)
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Float, PfComboDirect.Float)
    } else if (test == 3) {
        pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.Forward7, PfComboPWM.Forward1)
        basic.pause(10000)
        pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.Float, PfComboPWM.Float)
    } else if (test == 4) {
        for (let n = 0; n < 7; n++) {
            pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.IncrementPWM)
            pfTransmitter.singleOutputMode(0, 1, PfSingleOutput.IncrementPWM)
        }
        for (let n = 7; n > 0; n--) {
            pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.DecrementPWM)
            pfTransmitter.singleOutputMode(0, 1, PfSingleOutput.DecrementPWM)
        }
    }
})
