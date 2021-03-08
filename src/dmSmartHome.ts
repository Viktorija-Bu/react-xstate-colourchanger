import { MachineConfig, send, assign } from "xstate";
import { say, listen } from "./dmAppointment"
import { loadGrammar } from './runparser'
import { parse } from './chartparser'
import { grammar_home } from './Grammars/Intelligent_homeGrammar'

const SmartHome = (input: string) => {
    const grammar_SmartHome = loadGrammar(grammar_home);
    const parse_2:any = parse(input.split(/\s+/), grammar_SmartHome);
    const output = parse_2.resultsForRule(grammar_SmartHome.$root)[0];
    return output
}


export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: "start",
    states: {
        start:{
            on: {
                CLICK: "Start_Smart_Home"
            }
        },
        Start_Smart_Home:{
            id: "todo",
            initial: "prompt",
            on: {
                RECOGNISED:[{
                    cond: (context) => {return { action: SmartHome(context.recResult) } === undefined},
                    actions: assign((context) => { return { action: SmartHome(context.recResult) } }),
                    target: "chosen_action" },
                { target: ".nomatch" }]
            },
            states:{
                prompt: { entry: say("What is the action?"),
                        on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: { entry: say("Would you mind repeating?"),
                on: { ENDSPEECH: "ask" }}
            }
        },
        chosen_action:{
                id: "action_name",
                initial: "prompt",
                states: {
                    prompt: {
                        entry: send((context) => ({
                            type: "SPEAK",
                            value: `Action ${context.action.action} the ${context.action.object} performed`   
                    })),
                        on: { ENDSPEECH: "#todo" }
                }
            }
        },
    }
})

