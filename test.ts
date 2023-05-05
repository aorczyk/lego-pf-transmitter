/**
 * PF Transmitter tests
 */

pfTransmitter.connectIrSenderLed(AnalogPin.P0)

/*  Automated  tests */

if (true){
    // Test: singleOutputMode

    if (true){
        pfTransmitter.singleOutputMode(PfChannel.Channel1, PfOutput.Red, PfSingleOutput.Forward7)
        control.assert(
            pfTransmitter.lastCommand === 71,
            "singleOutputMode: Channel1, Red, Forward7" + `\nWrong command: ${pfTransmitter.lastCommand}`
        );

        basic.pause(600)

        pfTransmitter.singleOutputMode(PfChannel.Channel1, PfOutput.Red, PfSingleOutput.Float)
        control.assert(
            pfTransmitter.lastCommand === 2112,
            "singleOutputMode: Channel1, Red, Float" + `\nWrong command: ${pfTransmitter.lastCommand}`
        );

        // Test different channel and toggle bit.

        pfTransmitter.singleOutputMode(PfChannel.Channel2, PfOutput.Red, PfSingleOutput.Forward7)
        control.assert(
            pfTransmitter.lastCommand === 327,
            "singleOutputMode: Channel2, Red, Forward7" + `\nWrong command: ${pfTransmitter.lastCommand}`
        );

        // Different toggle bit
        pfTransmitter.singleOutputMode(PfChannel.Channel2, PfOutput.Red, PfSingleOutput.Forward7)
        control.assert(
            pfTransmitter.lastCommand === 2375,
            "singleOutputMode: Channel2, Red, Forward7" + `\nWrong command: ${pfTransmitter.lastCommand}`
        );

        // The same as first
        pfTransmitter.singleOutputMode(PfChannel.Channel2, PfOutput.Red, PfSingleOutput.Forward7)
        control.assert(
            pfTransmitter.lastCommand === 327,
            "singleOutputMode: Channel2, Red, Forward7" + `\nWrong command: ${pfTransmitter.lastCommand}`
        );

        basic.pause(600)
    }

    // Test: comboDirectMode

    if (true){
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Forward, PfComboDirect.Forward)
        control.assert(
            pfTransmitter.lastCommand === 21,
            "comboDirectMode: Channel1, Forward, Forward" + `\nWrong command: ${pfTransmitter.lastCommand}`
        );

        // Command should be repeated once.
        basic.pause(600)

        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Float, PfComboDirect.Float)
        control.assert(
            pfTransmitter.lastCommand === 16,
            "comboDirectMode: Channel1, Float, Float" + `\nWrong command: ${pfTransmitter.lastCommand}`
        );

        // Command should be repeated once.
        basic.pause(600)
    }

    // Test: comboPWMMode

    if (true){
        pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.Forward7, PfComboPWM.Forward1)
        control.assert(
            pfTransmitter.lastCommand === 3095,
            "comboPWMMode: Channel1, Forward7, Forward1" + `\nWrong command: ${pfTransmitter.lastCommand}`
        );

        // Command should be repeated once.
        basic.pause(600)

        pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.BrakeThenFloat, PfComboPWM.BrakeThenFloat)
        control.assert(
            pfTransmitter.lastCommand === 3208,
            "comboPWMMode: Channel1, BrakeThenFloat, BrakeThenFloat" + `\nWrong command: ${pfTransmitter.lastCommand}`
        );

        // Command should be repeated once.
        basic.pause(600)
    }
}


/*  Manual tests:
    0. singleOutputMode - two outputs in the same time: A - Increment, B - Decrement.
    1. singleOutputMode - two outputs in the same time: A - on, B - off.
    2. On and off: A - singleOutputMode, B - comboDirectMode.
    3. Hold command for 5s (auto repeat): A - comboDirectMode, B - comboPWMMode.
    4. singleOutputMode: increment and decrement (A - one output, B - two outputs).
    5. singleOutputMode: FullForward -> FullBackward -> ToggleDirection -> Float -> Backward7 -> ToggleFullForwardBackward -> Float.
    6. singleOutputMode: IncrementNumericalPWM, DecrementNumericalPWM.
*/

let test = 0;
let testMax = 6;
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
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.IncrementPWM)
        pfTransmitter.singleOutputMode(0, 1, PfSingleOutput.IncrementPWM)
    } else if (test == 1){
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Forward7)
        pfTransmitter.singleOutputMode(0, 1, PfSingleOutput.Forward7)
    } else if (test == 2) {
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Forward7)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Float)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Forward7)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Float)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Forward7)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Float)
    } else if (test == 3) {
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Forward, PfComboDirect.Backward)
        basic.pause(5000)
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Float, PfComboDirect.Float)
        basic.pause(2000)
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Backward, PfComboDirect.Forward)
        basic.pause(5000)
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.BrakeThenFloat, PfComboDirect.BrakeThenFloat)
    } else if (test == 4) {
        for (let n = 0; n < 7; n++){
            pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.IncrementPWM)
        }
        for (let n = 0; n < 7; n++) {
            pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.DecrementPWM)
        }
    } else if (test == 5) {
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.FullForward)
        basic.pause(2000)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.FullBackward)
        basic.pause(2000)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.ToggleDirection)
        basic.pause(2000)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Float)
        basic.pause(2000)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Backward7)
        basic.pause(2000)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.ToggleFullForwardBackward)
        basic.pause(2000)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Float)
    } else if (test == 6) {
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Backward1)
        basic.pause(1000)
        for (let n = 0; n < 7; n++) {
            pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.IncrementNumericalPWM)
        }
        basic.pause(2000)
        for (let n = 0; n < 7; n++) {
            pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.DecrementNumericalPWM)
        }
        basic.pause(1000)
        pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.Forward1)
        basic.pause(1000)
        for (let n = 0; n < 7; n++) {
            pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.IncrementNumericalPWM)
        }
        basic.pause(2000)
        for (let n = 0; n < 7; n++) {
            pfTransmitter.singleOutputMode(0, 0, PfSingleOutput.DecrementNumericalPWM)
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
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Forward, PfComboDirect.Float)
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Float, PfComboDirect.Float)
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Forward, PfComboDirect.Float)
        pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Float, PfComboDirect.Float)
    } else if (test == 3) {
        pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.Forward7, PfComboPWM.Forward1)
        basic.pause(5000)
        pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.Float, PfComboPWM.Float)
        basic.pause(2000)
        pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.Forward1, PfComboPWM.Forward7)
        basic.pause(5000)
        pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.BrakeThenFloat, PfComboPWM.BrakeThenFloat)
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