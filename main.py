"""
    microbit_elevator_callbuttons
    COP for the Micro:Bit elevator compatibility suite
"""

# Elevator details
elevator_data = {
    'status': 0,
    'current_floorNumber': 0,
    'directional': 0,

    'sendMachine': {
        'receive_data': {
            'text': "",
            'value': 0
        }
    },

    'COP': {
        'floorNumber': 1,
        'call_directions_status': {
            'down': False,
            'up': False
        },
        'send_data': {
            'text': "",
            'value': 0
        }
    }
}

def ensurePositiveNegativeBinaryOnly(variable_unfixed): 
    """
        ensurePositiveNegativeBinaryOnly ensures that the input is -1 or 1, nothing more or less. 
    
        Parameters: 
            variable_unfixed: the variable to check
        Returns: 
            variable_fixed: the modified variable_unfixed
    """

    try: 
        # Ensure that variable_unfixed is 1 or -1, nothing more or nothing less.
        if (variable_unfixed >= 1):
            variable_fixed = 1
        elif (variable_unfixed <= -1):
            variable_fixed = -1
        
        # Return the fixed data. 
        return(variable_fixed)
    except: 
        # An error occured, so it could not be fixed. 
        return(variable_unfixed)


def playAudio(audio_name): 
    """
        playAudio plays the selected audio. 

        Parameters: 
            audio_name: the audio name
        Returns: none
    """

    if ("buttonClick" in audio_name): 
        music.play_tone(800, music.beat(BeatFraction.HALF))

def sendMessage(send_type = None): 
    """
        sendMessage sends the current COP's send_data value to the radio. 

        Parameters: 
            send_type: the data type to send
        Returns: none
    """

    if send_type == 'str': 
        # send string only
        radio.send_string(elevator_data['COP']['send_data']['text'])
    elif send_type == 'float' or send_type == 'int': 
        # send number only
        radio.send_number(elevator_data['COP']['send_data']['value'])
    else: 
        # send string and number by default
        radio.send_value(elevator_data['COP']['send_data']['text'], elevator_data['COP']['send_data']['value'])

def sendCallSignal(target_direction): 
    """
        sendCallSignal sends the call signal for the lift. 

        Parameters: 
            target_direction: (int) target direction 
        Returns: 
            send_data: the sent data
    """

    # Ensure that target_direction is 1 or -1, nothing more or nothing less. 
    target_direction = ensurePositiveNegativeBinaryOnly(target_direction)
    
    # Generate the message data, which contains "L<floornumber>call" followed by the direction.
    elevator_data['COP']['send_data']['text'] = ("L" + str(elevator_data['COP']['floorNumber']) + "call")
    elevator_data['COP']['send_data']['value'] = target_direction

    # Send the message.
    sendMessage()

    # Return
    return(elevator_data['COP']['send_data'])

def clickButton(target_direction): 
    """
        clickButton is what should happen when a button is clicked. 

        Parameters: 
            target_direction: the target direction
        Returns: none
    """
    
    # Ensure that target_direction is 1 or -1, nothing more or nothing less.
    target_direction = ensurePositiveNegativeBinaryOnly(target_direction)

    # Send the call signal. 
    sendCallSignal(target_direction)
    
    # Play the audio. 
    playAudio('buttonClick')

# Button A is the down button.
def on_button_pressed_a():
    clickButton(-1)

# Button B is the up button.
def on_button_pressed_b():
    clickButton(1)

# Map the buttons. 
input.on_button_pressed(Button.A, on_button_pressed_a)
input.on_button_pressed(Button.B, on_button_pressed_b)

def changeLEDsStatus(): 
    """
        change the LED status based on the lift's status
    """

    if (elevator_data['status'] == -1): 
        # when the lift is out of order
        basic.show_string("OUT OF ORDER")
    else: 
        if (elevator_data['COP']['call_directions_status']['down']): 
            led.plot(0, 2)
        elif not(elevator_data['COP']['call_directions_status']['down']): 
            led.unplot(0, 2)
        
        if (elevator_data['COP']['call_directions_status']['up']): 
            led.plot(0, 2)
        elif not(elevator_data['COP']['call_directions_status']['up']): 
            led.unplot(0, 2)

def acknowledgeCallSignal(target_direction): 
    """
        acknowledgeCallSignal is what should occur when a call signal is received. 

        Parameters: 
            target_direction: the target direction
        Returns: none
    """

    # Ensure that the value is only -1 (down) or 1 (up). 
    target_direction = ensurePositiveNegativeBinaryOnly(target_direction)

    # Set the call direction status of the specific direction to true. 
    if (target_direction == 1):
        elevator_data['COP']['call_directions_status']['up'] = True
    elif (target_direction == -1): 
        elevator_data['COP']['call_directions_status']['down'] = True


# When certain values are received from the sender
def on_received_value(name, value):
    elevator_data['sendMachine']['receive_data']['text'] = name
    elevator_data['sendMachine']['receive_data']['value'] = value

    if ('gotL' in name) and ('call' in name):
        # The call was acknowledged. 
        acknowledgeCallSignal(value)
         
radio.on_received_value(on_received_value)

changeLEDsStatus()

