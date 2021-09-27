pfTransmitter.connectIrSenderLed(AnalogPin.P0)
pfTransmitter.debug = true;

input.onButtonPressed(Button.A, function () {
    pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Forward, ComboDirect.Float)
    basic.pause(200);
    pfTransmitter.comboDirectMode(Channel.Channel1, ComboDirect.Float, ComboDirect.Float)
    //    basic.clearScreen();
})