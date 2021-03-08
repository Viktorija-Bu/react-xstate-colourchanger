import { MachineConfig, send, Action } from "xstate";
import { grammar } from "./Grammars/quotesGrammar";
import { loadGrammar } from "./runparser";
import { parse } from "./chartparser";

const grammar2 = loadGrammar(grammar)
console.log(grammar2)

const input = "to do is to be"
const prs:any = parse(input.split(/\s+/),grammar2)
console.log(prs)
console.log(prs.resultsForRule(grammar2.$root)[0])


const sayColour: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Repainting to ${context.recResult}`
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'welcome'
            }
        },
        welcome: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    { target: 'stop', cond: (context) => context.recResult === 'stop' },
                    { target: 'repaint' }]
            },
            states: {
                prompt: {
                    entry: say("Tell me the colour"),
                    on: { ENDSPEECH: 'ask' }
                },
                ask: {
                    entry: send('LISTEN'),
                },
            }
        },
        stop: {
            entry: say("Ok"),
            always: 'init'
        },
        repaint: {
            initial: 'prompt',
            states: {
                prompt: {
                    entry: sayColour,
                    on: { ENDSPEECH: 'repaint' }
                },
                repaint: {
                    entry: 'changeColour',
                    always: '#root.dm.welcome'
                }
            }
        }
    }
})
