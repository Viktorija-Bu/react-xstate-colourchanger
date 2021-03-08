export const grammar_home = `
<grammar root="action">
    <rule id="action">
        <ruleref uri="#todo"/>
        <tag> out.action = rules.todo.actions; out.object = rules.todo.objects</tag>
    </rule>
    <rule id="action_1">
        <one-of>
            <item>
            turn off
            </item>
            <item>
            turn on
            </item>
        </one-of>
    </rule>
    <rule id="action_2">
        <one-of>
            <item>
            open
            </item>
            <item>
            close
            </item>
        </one-of>
    </rule>
    <rule id="object_1"> 
        <one-of> 
            <item> 
            light 
            </item> 
            <item> 
            air conditioning 
            </item> 
            <item> 
            A C <tag> out = 'air conditioning'</tag>
            </item>
            <item> 
            heat
            </item> 
        </one-of>
    </rule>
    <rule id="object_2">
        <one-of>
            <item> 
            window 
            </item> 
            <item> 
            door 
            </item>
        </one-of>
    </rule>
    <rule id="todo">
    <item repeat="0-">please</item>
        <one-of>
            <item>
            <ruleref uri="#action_1"/>
            <tag>out.actions=rules.action_1</tag>
            the
            <ruleref uri="#object_1"/>
            <tag>out.objects=rules.object_1</tag>
            </item>
            <item>
            <ruleref uri="#action_2"/>
            <tag>out.actions=rules.action_2</tag>
            the
            <ruleref uri="#object_2"/>
            <tag>out.objects=rules.object_2</tag>
            </item>
        </one-of>
    </rule>
</grammar>
`
