# Power Functions Transmitter

Control your LEGO Power Functions devices simultaneously with Micro:bit and an 940 nm emitting diode. 

### Features:
- all PF commands implemented
- controlling multiple devices at the same time
- quick change the state of the channel output

### :warning: Warning!
**Lighting the diode and the IR receiver with sunlight :sunny: or from an ordinary light bulb :bulb: may interfere with the signal reception.**

## Installation

1. Open MakeCode and select '+ Extensions' in the 'Advanced' menu. 
2. Enter the project URL https://github.com/aorczyk/lego-pf-transmitter in the search field.
3. Select the `PF Transmitter` extension.

# Documentation

## pfTransmitter.connectIrSenderLed

Connects infrared 940 nm emitting diode at specified analog pin. 

```sig
pfTransmitter.connectIrSenderLed(AnalogPin.P0)
```
### Parameters

- `pin` - the analog pin where ir diode is connected

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


## pfTransmitter.getLastCommandSendingTime

Returns the duration of sending the command (ms).

```sig
pfTransmitter.getLastCommandSendingTime()
```

## pfTransmitter.advancedSettings

Advanced settings.

```sig
pfTransmitter.advancedSettings(500, 0, 5)
```

### Parameters

- `repeatCommandAfter` - the time after which combo command is repeated (ms)
- `afterSignalPause` - the pause before sending next signal in package (ms)
- `signalRepeatNumber` - the number of signals in package


## MakeCode Example

```blocks
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