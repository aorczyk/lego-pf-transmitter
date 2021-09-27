pfTransmitter.connectIrSenderLed(AnalogPin.P0, true)

input.onButtonPressed(Button.A, function () {
    // pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Forward, ComboDirect.Float)
    // pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Float, ComboDirect.Float)
    //    basic.clearScreen();
    // basic.pause(200);

    pfTransmitter.singleOutputMode(0, 0, SingleOutput.IncrementPWM)
    pfTransmitter.singleOutputMode(0, 1, SingleOutput.IncrementPWM)
    // pfTransmitter.singleOutputMode(0, 0, SingleOutput.Forward7)
    // pfTransmitter.singleOutputMode(0, 1, SingleOutput.Forward7)
    // basic.pause(600);
    // pfTransmitter.singleOutputMode(0, 0, SingleOutput.Float)
    // pfTransmitter.singleOutputMode(0, 1, SingleOutput.Float)
})

input.onButtonPressed(Button.B, function () {
    pfTransmitter.singleOutputMode(0, 0, SingleOutput.DecrementPWM)
    pfTransmitter.singleOutputMode(0, 1, SingleOutput.DecrementPWM)
    // pfTransmitter.singleOutputMode(0, 0, SingleOutput.Float)
    // pfTransmitter.singleOutputMode(0, 1, SingleOutput.Float)
})
