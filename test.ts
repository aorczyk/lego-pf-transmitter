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
// 4. comboPWMMode - hold command for 10s (auto repeat).

input.onButtonPressed(Button.AB, function () {
    test += 1;

    if (test > testMax){
        test = 0
    }

    basic.showNumber(test)
})

input.onButtonPressed(Button.A, function () {
    if (test == 0){
        pfTransmitter.singleOutputMode(0, 0, SingleOutput.IncrementPWM)
        pfTransmitter.singleOutputMode(0, 1, SingleOutput.IncrementPWM)
    } else if (test == 1){
        pfTransmitter.singleOutputMode(0, 0, SingleOutput.Forward7)
        pfTransmitter.singleOutputMode(0, 1, SingleOutput.Forward7)
    } else if (test == 2) {
        pfTransmitter.singleOutputMode(0, 0, SingleOutput.Forward7)
        pfTransmitter.singleOutputMode(0, 0, SingleOutput.Float)
    } else if (test == 3) {
        pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Forward, ComboDirect.Float)
        pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Float, ComboDirect.Float)
    } else if (test == 4) {
        pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Forward, ComboDirect.Float)
        basic.pause(10000)
        pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Float, ComboDirect.Float)
    } else if (test == 5) {
        pfTransmitter.comboPWMMode(Channel.Channel1, ComboPWM.Forward3, ComboPWM.Forward7)
        basic.pause(10000)
        pfTransmitter.comboPWMMode(Channel.Channel1, ComboPWM.Float, ComboPWM.Float)
    }
})

input.onButtonPressed(Button.B, function () {
    if (test == 0) {
        pfTransmitter.singleOutputMode(0, 0, SingleOutput.DecrementPWM)
        pfTransmitter.singleOutputMode(0, 1, SingleOutput.DecrementPWM)
    } else if (test == 1) {
        pfTransmitter.singleOutputMode(0, 0, SingleOutput.Float)
        pfTransmitter.singleOutputMode(0, 1, SingleOutput.Float)
    }
})
