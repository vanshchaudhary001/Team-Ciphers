with open('client/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

# Make askCopilotDirect return sendChatMessage
c = c.replace(
    'function askCopilotDirect(queryText) {\n      const input = document.getElementById(\'chatbot-input\');\n      if (input) {\n        input.value = queryText;\n      }\n      sendChatMessage();\n    }',
    'function askCopilotDirect(queryText) {\n      const input = document.getElementById(\'chatbot-input\');\n      if (input) {\n        input.value = queryText;\n      }\n      return sendChatMessage();\n    }'
)

# In sendChatMessage, return runCopilotResponseWithThinking
c = c.replace('runCopilotResponseWithThinking(query,', 'return runCopilotResponseWithThinking(query,')
c = c.replace('return return runCopilotResponseWithThinking', 'return runCopilotResponseWithThinking')

with open('client/index.html', 'w', encoding='utf-8') as f:
    f.write(c)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)
with open('client/public/index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print("[OK] Updated askCopilotDirect and sendChatMessage to return promises")
