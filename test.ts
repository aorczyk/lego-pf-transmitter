pfTransmitter.connectIrSenderLed(AnalogPin.P0, true)

let test = 3;
let testMax = 3;
basic.showNumber(test)

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
        basic.showString('L')
        pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Forward, ComboDirect.Float)
        basic.pause(600);
        pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Float, ComboDirect.Float)
       basic.clearScreen();
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
