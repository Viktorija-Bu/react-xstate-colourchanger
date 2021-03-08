import { MachineConfig, send, Action, assign, actions } from "xstate";
const {cancel} = actions


export function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

export function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

let cnt = 0

function helpme(saysmth: Action<SDSContext, SDSEvent>, nomatch:string, help:string, maxspeech2:string) : MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: "prompt",
        states:{
            prompt: {
                entry: saysmth,
                on: {ENDSPEECH: 'ask'}
            },

            ask: {
                entry: [listen(), send("MAXSPEECH", {delay: 3500, id: "maxspeech2"})]
            },

            help: {
                entry: say(help),
                on: { ENDSPEECH: "prompt" }
            },

            nomatch: {
                entry: say(nomatch),
                on: { ENDSPEECH: "prompt" }},

            maxspeech: {
                entry: say(maxspeech2),
                on: { 
                    ENDSPEECH: [
                        {cond: () => (cnt++) ===3, target: "prompt"},
                        {target: "#machine"}
                    ]}}
            },
        
    })
}

const proxyurl = "https://cors-anywhere.herokuapp.com/";
const rasaurl = 'https://viktorija-lab2.herokuapp.com/model/parse'
const nluRequest = (text: string) =>
    fetch(new Request(proxyurl + rasaurl, {
        method: 'POST',
        headers: { 'Origin': 'http://maraev.me' }, // only required with proxy
        body: `{"text": "${text}"}`
    }))
        .then(data => data.json());

const grammar: { [index: string]: { person?: string, day?: string, time?: string } } = {
    "Donald": { person: "Donald Trump" }, 
    "Joe": { person: "Joe Biden" },
    "Barack": { person: "Barack Obama" },
    "George": { person: "George W. Bush" },
    "Bill": { person: "Bill Clinton" },
    "on Monday": { day: "Monday" },
    "on Tuesday": { day: "Tuesday" },
    "on Wednesday": { day: "Wednesday" },
    "on Thursday": { day: "Thursday" },
    "on Friday": { day: "Friday" },
    "on Saturday": { day: "Saturday" },
    "on Sunday": { day: "Sunday" },
    "at 7": { time: "7:00" },
    "at 8": { time: "8:00" },
    "at 9": { time: "9:00" },
    "at 10": { time: "10:00" },
    "at 11": { time: "11:00" },
    "at 12": { time: "12:00" },
    "at 1": { time: "13:00" },
    "at 2": { time: "14:00" },
    "at 3": { time: "15:00" },
    "at 4": { time: "16:00" },
    "at 5": { time: "17:00" },
    "at 6": { time: "18:00" },
}

const grammar2: { [index: string]: { yes?: string, no?: string } } = { 
    "yes": { yes: "yes" },
    "of course": { yes: "yes" },
    "sure": { yes: "yes" },
    "definitely": { yes: "yes" },
    "yeah": { yes: "yes" },
    "most likely": { yes: "yes" },
    "no": { no: "no" },
    "no way": { no: "no" },
    "never": { no: "no" },
    "no for sure": { no: "no" },
    "I don't think so": { no: "no" },
    "not likely": { no: "no" },
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    id: "machine",
    initial: "start",
    states: {
        start:{
            on: {
                CLICK: "thing_to_do"
            }
        },
        thing_to_do:{
            id: "choose",
            initial: "prompt",
            on: {
                RECOGNISED:[{
                    actions: assign((context) => { return { choice: context.recResult } }),
                    target: "chosen_thing" },
                
                { target: ".nomatch" }],

                MAXSPEECH: ".maxspeech"
            },

            ...helpme(say("What would you like to do?"), "Would you mind repeating?", "Choose one of the three actions: appointment, to do list or timer", "Please provide input")

        },
        chosen_thing:{
            invoke: {
                id: "RASA",
                src: (context, event) =>  nluRequest(context.choice),
                onDone:{
                    target: "final",
                    actions:[
                        assign((context, event) => { return { res: event.data.intent.name} }),
                        (context:SDSContext, event:any) => console.log(event.data)]
                },
                onError:{
                    target: "thing_to_do",
                    actions: (context, event) => console.log(event.data)

                }

            }

        },
        final:{
            initial: "prompt",
            on:{
                ENDSPEECH:[{
                    cond: (context) => context.res === "Appointment",
                    target: "Appointment" },
                    { cond: (context) => context.res === "TODO_item",
                    target: "TODO_item" },
                    { cond: (context) => context.res === "Timer",
                    target: "Timer" },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Let me check`}))},
                nomatch: {
                    entry: say("The task is unavailable"),
                    on: { ENDSPEECH: "#choose" }
                        
                    }
                        
                }

        },
        TODO_item: {
            initial: "prompt",
            on: { ENDSPEECH: "thing_to_do" },
            states:{
                prompt:{
                    entry: say("Sorry, but this tool does not exist")
                }
            }
        },
        Timer: {
            initial: "prompt",
            on: { ENDSPEECH: "thing_to_do" },
            states:{
                prompt:{
                    entry: say("Sorry, but this tool does not exist")
                }
            }
        },
        Appointment:{
            initial: "prompt",
            on:{ ENDSPEECH: "who" },
            states:{
                prompt:{
                    entry: say("Let's create an appointment")
                }
            }
        },
        who: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "person" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { person: grammar[context.recResult].person } }),
                    target: "day" },
                    { cond: (context) => context.recResult === "help", 
                    target: ".help" },

                { target: ".nomatch" }],

                MAXSPEECH: ".maxspeech"
            },

            ...helpme(say("Who are you meeting with?"), "Sorry I don't know them", "Name a person from your contact list whom you want to meet", "Please repeat the input")
        },
        day: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "day" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { day: grammar[context.recResult].day } }),
                    target: "whole_day"},
                    { cond: (context) => context.recResult === "help", 
                    target: ".help" },
                
                { target: ".nomatch" }],

                MAXSPEECH: ".maxspeech"
            },

            ...helpme(send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.person}. On which day is your meeting?`})), "Sorry I did not understand", "Name a day when you want to meet your chosen person from the contact list", "I cannot grasp the input, would you mind repeating?"),           
        },
        whole_day: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "yes" in (grammar2[context.recResult] || {}),
                    actions: assign((context) => { return { yes: grammar2[context.recResult].yes } }),
                    target: "app" },
                    { cond: (context) => "no" in (grammar2[context.recResult] || {}),
                    actions: assign((context) => { return { no: grammar2[context.recResult].no } }),
                    target: "time" },

                { target: ".nomatch" }],

                MAXSPEECH: ".maxspeech"
            },

            ...helpme(say("Will it take the whole day?"), "Please repeat", "You need to tell me whether you want to meet the person from morning to late afternoon", "Looks like the input is unclear, please repeat")
        },
        app: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "yes" in (grammar2[context.recResult] || {}),
                    actions: assign((context) => { return { yes: grammar2[context.recResult].yes } }),
                    target: "done" },
                    { cond: (context) => "no" in (grammar2[context.recResult] || {}),
                    actions: assign((context) => { return { no: grammar2[context.recResult].no } }),
                    target: "who" },

                { target: ".nomatch" }],

                MAXSPEECH: ".maxspeech"
            },

            ...helpme(send((context) => ({
                        type: "SPEAK",
                        value: `Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?`})), "Please repeat", "Time to make a decision whether you want to meet your chosen person from morning to afternoon", "Time to repeat the input")
        },
        done: {
            initial: "prompt",
            on: { ENDSPEECH: "start" },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Your appointment has been created!`
                    }))
                }
            }
        },
        time: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "time" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { time: grammar[context.recResult].time } }),
                    target: "app2"

                },
                { target: ".nomatch" }],

                MAXSPEECH: ".maxspeech"
            },

            ...helpme(send((context) => ({
                        type: "SPEAK",
                        value: `${context.day} it is. What time is your meeting?`})), "Sorry could you repeat", "Say hour for the meeting on your chosen day", "Seems like I cannot grasp you, please say one more time")
        },
        app2: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "yes" in (grammar2[context.recResult] || {}),
                    actions: assign((context) => { return { yes: grammar2[context.recResult].yes } }),
                    target: "done" },
                    { cond: (context) => "no" in (grammar2[context.recResult] || {}),
                    actions: assign((context) => { return { no: grammar2[context.recResult].no } }),
                    target: "who" },

                { target: ".nomatch" }],

                MAXSPEECH: ".maxspeech"
            },

            ...helpme(send((context) => ({
                        type: "SPEAK",
                        value: `Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time}?`})), "Please repeat", "Time to make a decision comrade", "Are you being silent? Repeat please")
        },
    }
})