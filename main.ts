/** 
    microbit_elevator_callbuttons
    COP for the Micro:Bit elevator compatibility suite

 */
//  Elevator details
let elevator_data = {
    "status" : 0,
    "current_floorNumber" : 0,
    "directional" : 0,
    "sendMachine" : {
        "receive_data" : {
            "text" : "",
            "value" : 0,
        }
        ,
    }
    ,
    "COP" : {
        "floorNumber" : 1,
        "call_directions_status" : {
            "down" : false,
            "up" : false,
        }
        ,
        "send_data" : {
            "text" : "",
            "value" : 0,
        }
        ,
    }
    ,
}

function ensurePositiveNegativeBinaryOnly(variable_unfixed: number): number {
    let variable_fixed: number;
    /** 
        ensurePositiveNegativeBinaryOnly ensures that the input is -1 or 1, nothing more or less. 
    
        Parameters: 
            variable_unfixed: the variable to check
        Returns: 
            variable_fixed: the modified variable_unfixed
    
 */
    try {
        //  Ensure that variable_unfixed is 1 or -1, nothing more or nothing less.
        if (variable_unfixed >= 1) {
            variable_fixed = 1
        } else if (variable_unfixed <= -1) {
            variable_fixed = -1
        }
        
        //  Return the fixed data. 
        return variable_fixed
    }
    catch (_) {
        //  An error occured, so it could not be fixed. 
        return variable_unfixed
    }
    
}

function playAudio(audio_name: string) {
    /** 
        playAudio plays the selected audio. 

        Parameters: 
            audio_name: the audio name
        Returns: none
    
 */
    if (audio_name.indexOf("buttonClick") >= 0) {
        music.playTone(800, music.beat(BeatFraction.Half))
    }
    
}

function sendMessage(send_type: any = null) {
    /** 
        sendMessage sends the current COP's send_data value to the radio. 

        Parameters: 
            send_type: the data type to send
        Returns: none
    
 */
    if (send_type == "str") {
        //  send string only
        radio.sendString(elevator_data["COP"]["send_data"]["text"])
    } else if (send_type == "float" || send_type == "int") {
        //  send number only
        radio.sendNumber(elevator_data["COP"]["send_data"]["value"])
    } else {
        //  send string and number by default
        radio.sendValue(elevator_data["COP"]["send_data"]["text"], elevator_data["COP"]["send_data"]["value"])
    }
    
}

function sendCallSignal(target_direction: number) {
    /** 
        sendCallSignal sends the call signal for the lift. 

        Parameters: 
            target_direction: (int) target direction 
        Returns: 
            send_data: the sent data
    
 */
    //  Ensure that target_direction is 1 or -1, nothing more or nothing less. 
    target_direction = ensurePositiveNegativeBinaryOnly(target_direction)
    //  Generate the message data, which contains "L<floornumber>call" followed by the direction.
    elevator_data["COP"]["send_data"]["text"] = "L" + ("" + elevator_data["COP"]["floorNumber"]) + "call"
    elevator_data["COP"]["send_data"]["value"] = target_direction
    //  Send the message.
    sendMessage()
    //  Return
    return elevator_data["COP"]["send_data"]
}

function clickButton(target_direction: number) {
    /** 
        clickButton is what should happen when a button is clicked. 

        Parameters: 
            target_direction: the target direction
        Returns: none
    
 */
    //  Ensure that target_direction is 1 or -1, nothing more or nothing less.
    target_direction = ensurePositiveNegativeBinaryOnly(target_direction)
    //  Send the call signal. 
    sendCallSignal(target_direction)
    //  Play the audio. 
    playAudio("buttonClick")
}

//  Button A is the down button.
//  Button B is the up button.
//  Map the buttons. 
input.onButtonPressed(Button.A, function on_button_pressed_a() {
    clickButton(-1)
})
input.onButtonPressed(Button.B, function on_button_pressed_b() {
    clickButton(1)
})
function changeLEDsStatus() {
    /** change the LED status based on the lift's status */
    if (elevator_data["status"] == -1) {
        //  when the lift is out of order
        basic.showString("OUT OF ORDER")
    } else {
        if (elevator_data["COP"]["call_directions_status"]["down"]) {
            led.plot(0, 2)
        } else if (!elevator_data["COP"]["call_directions_status"]["down"]) {
            led.unplot(0, 2)
        }
        
        if (elevator_data["COP"]["call_directions_status"]["up"]) {
            led.plot(0, 2)
        } else if (!elevator_data["COP"]["call_directions_status"]["up"]) {
            led.unplot(0, 2)
        }
        
    }
    
}

function acknowledgeCallSignal(target_direction: number) {
    /** 
        acknowledgeCallSignal is what should occur when a call signal is received. 

        Parameters: 
            target_direction: the target direction
        Returns: none
    
 */
    //  Ensure that the value is only -1 (down) or 1 (up). 
    target_direction = ensurePositiveNegativeBinaryOnly(target_direction)
    //  Set the call direction status of the specific direction to true. 
    if (target_direction == 1) {
        elevator_data["COP"]["call_directions_status"]["up"] = true
    } else if (target_direction == -1) {
        elevator_data["COP"]["call_directions_status"]["down"] = true
    }
    
}

//  When certain values are received from the sender
radio.onReceivedValue(function on_received_value(name: string, value: number) {
    elevator_data["sendMachine"]["receive_data"]["text"] = name
    elevator_data["sendMachine"]["receive_data"]["value"] = value
    if (name.indexOf("gotL") >= 0 && name.indexOf("call") >= 0) {
        //  The call was acknowledged. 
        acknowledgeCallSignal(value)
    }
    
})
changeLEDsStatus()
