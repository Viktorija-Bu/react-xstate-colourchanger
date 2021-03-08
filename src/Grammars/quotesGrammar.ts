export const grammar = `
<grammar root="Quote">
   <rule id="Quote">
        <ruleref uri="#quote"/>
        <tag>out.quote = new Object(); out.quote.author=rules.quote.type</tag>
   </rule>
   <rule id="utterance">
        <one-of>
            <item>
            to do is to be<tag>out="Socrates";</tag>
            </item>
            <item>
            to be is to do<tag>out="Sartre";</tag>
            </item>
            <item>
            do be do be do<tag>out="Sinatra";</tag>
            </item>
      </one-of>
    <rule id="quote">
        <ruleref uri="#utterance"/>
        <tag>out.type=rules.utterance</tag>
   </rule>
</grammar>
`


