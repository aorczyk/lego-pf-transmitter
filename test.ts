pfTransmitter.connectIrSenderLed(AnalogPin.P0, false)

let test = 5;
let testMax = 5;
basic.showNumber(test)

// Tests:
// 0. singleOutputMode - Increment - Decrement.
// 1. singleOutputMode - Two outputs in the same time.
// 2. singleOutputMode - on off.
// 3. comboDirectMode - on off.
// 4. comboDirectMode - hold command for 10s (auto repeat).
// 5. comboPWMMode - hold command for 10s (auto repeat).

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
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Float, PfComboDirect.Float)
    } else if (test == 4) {
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Forward, PfComboDirect.Float)
        basic.pause(10000)
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Float, PfComboDirect.Float)
    } else if (test == 5) {
        pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.Forward3, PfComboPWM.Forward7)
        basic.pause(10000)
        pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.Float, PfComboPWM.Float)
    }
})

input.onButtonPressed(Button.B, function () {
    if (test == 0) {
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.DecrementPWM)
        pfTransmitter.singleOutputMode(0, 1, PfSingleOutput.DecrementPWM)
    } else if (test == 1) {
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Float)
        pfTransmitter.singleOutputMode(0, 1, PfSingleOutput.Float)
    }
})
