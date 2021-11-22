# Power Functions Transmitter

Control your LEGO Power Functions devices simultaneously with Micro:bit and an 940 nm emitting diode. 

### Features:
- all Power Functions commands were implemented
- controlling multiple devices at the same time
- precise control (quick change the state of the channel output)

### References:
- [LEGO Power Functions RC](https://www.philohome.com/pf/LEGO_Power_Functions_RC.pdf)

## :warning: Warning!
**The light (solar :sunny: or lamp :bulb:) falling on the diode or ir receiver interferes with the signal transmission.**

## Command execution delay time
Every command sending to receiver is a package of five the same signals. 
Command execution delay time depends of the signal length (maximum length is 16ms) and light interference to the signal (which may result in the first signals not being received). 
It could be different each time. 
The maximum delay time will be if the receiver only receives the fifth signal, is around: 16*5 = 80ms + time for processing the signals.


# Documentation

## pfTransmitter.connectIrSenderLed

Connects infrared 940 nm emitting diode at specified analog pin. 

```sig
pfTransmitter.connectIrSenderLed(AnalogPin.P0, false)
```
### Parameters

- `pin` - the analog pin where ir diode is connected
- `debug` - turn on debug mode if set to true (false by default). In the console, it prints commands in the following format: "1100-0001-0111-0101 = 1047"

## pfTransmitter.singleOutputMode

Single output mode (speed remote control). 
This mode is able to control: one output at a time with PWM or clear/set/toggle control pins. 
This mode has no timeout for lost IR on all commands except "full forward" and "full backward". 
Following commands are supported:
- Float
- Forward step 1
- Forward step 2
- Forward step 3
- Forward step 4
- Forward step 5
- Forward step 6
- Forward step 7
- Brake then float
- Backward step 7
- Backward step 6
- Backward step 5
- Backward step 4
- Backward step 3
- Backward step 2
- Backward step 1
- Increment
- Decrement
- Full forward
- Full backward
- Toggle full forward/backward (default forward)
- Toggle full forward (Stop → Fw, Fw → Stop, Bw → Fw)
- Toggle full backward (Stop → Bw, Bw → Stop, Fwd → Bw)
- Toggle direction
- Increment Numerical PWM
- Decrement Numerical PWM
- Clear C1 (negative logic – C1 high)
- Set C1 (negative logic – C1 low)
- Toggle C1
- Clear C2 (negative logic – C2 high)
- Set C2 (negative logic – C2 low)
- Toggle C2

```sig
pfTransmitter.singleOutputMode(PfChannel.Channel1, PfOutput.Red, PfSingleOutput.Forward7)
```

### Parameters

- `channel` - the channel from `0` to `3`
- `output` - the output: `0` (red), `1` (blue)
- `command` - the command

## pfTransmitter.comboDirectMode

Combo direct mode (ordinary remote control). 
Controlling the state of both output A and B at the same time. 
This mode has timeout for lost IR. 
Following commands are supported:
- Float
- Forward
- Backward
- Brake then float

```sig
pfTransmitter.comboDirectMode(PfChannel.Channel1, PfComboDirect.Forward, PfComboDirect.Float)
```

### Parameters

- `channel` - the channel from `0` to `3`
- `red` - the red output command
- `blue` - the blue output command

## pfTransmitter.comboPWMMode

Combo PWM mode - controlling the state of both output A and B at the same time. 
This mode has timeout for lost IR. 
Following commands are supported:
- Float
- Forward step 1
- Forward step 2
- Forward step 3
- Forward step 4
- Forward step 5
- Forward step 6
- Forward step 7
- Brake then float
- Backward step 7
- Backward step 6
- Backward step 5
- Backward step 4
- Backward step 3
- Backward step 2
- Backward step 1

```sig
pfTransmitter.comboPWMMode(PfChannel.Channel1, PfComboPWM.Forward7, PfComboPWM.Forward1)
```

### Parameters

- `channel` - the channel from `0` to `3`
- `red` - the red output command
- `blue` - the blue output command


## pfTransmitter.advancedSettings

Advanced settings.

```sig
pfTransmitter.advancedSettings(repeatCommandAfter, afterSignalPause, signalRepeatNumber)
```

### Parameters

- `repeatCommandAfter` - the time after which combo command is repeated (ms), default: 500
- `afterSignalPause` - the pause before sending next signal in package (ms), default: 0
- `signalRepeatNumber` - the number of signals in package, default: 5


## MakeCode Example

``` blocks
pfTransmitter.connectIrSenderLed(AnalogPin.P0)

input.onButtonPressed(Button.A, function() {
    pfTransmitter.singleOutputMode(PfChannel.Channel1, PfOutput.Red, PfSingleOutput.Forward7)
    pfTransmitter.singleOutputMode(PfChannel.Channel1, PfOutput.Blue, PfSingleOutput.Forward7)
})

input.onButtonPressed(Button.B, function() {
    pfTransmitter.singleOutputMode(PfChannel.Channel1, PfOutput.Red, PfSingleOutput.Float)
    pfTransmitter.singleOutputMode(PfChannel.Channel1, PfOutput.Blue, PfSingleOutput.Float)
})
```

## Disclaimer

LEGO® is a trademark of the LEGO Group of companies which does not sponsor, authorize or endorse this project.

## License

Copyright (C) 2021 Adam Orczyk

Licensed under the MIT License (MIT). See LICENSE file for more details.

## Supported targets

* for PXT/microbit
