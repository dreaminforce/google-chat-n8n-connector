# Google Chat -> n8n Connector (via Apps Script): A Practical Build Guide You Can Paste Your Own Code Into

Google's official quickstart for Google Chat apps is intentionally simple: it shows you how to create a Chat app in Google Cloud, wire it to an Apps Script deployment, and prove the loop works by returning a basic response inside Google Chat. That's the important part -- once you can reliably receive a Chat event in Apps Script and send a reply back to Chat, you have a production-grade entry point.

This post takes that exact foundation and turns it into something immediately useful: a connector that forwards Google Chat messages into an n8n workflow and then posts the workflow's output back into Google Chat. Your Apps Script stays lean. Your automation logic lives in n8n. Google Chat becomes the front door for users.

Reference: https://developers.google.com/workspace/chat/quickstart/apps-script-app?utm_source=chatgpt.com

Where you see placeholders below, you will paste your own Apps Script code, your n8n workflow JSON, and your screenshots.

---

## The idea: keep Apps Script boring, let n8n do the real work

If you try to build "everything" inside Apps Script, you will quickly end up with a bot that's hard to evolve. You'll add one integration, then another, then a routing rule, then some conditional logic, then error handling, then retries -- and before you know it, Apps Script is doing what n8n already does better.

So the connector pattern is simple:
- Google Chat is the UI where messages originate.
- Apps Script is the glue layer that receives Chat events and calls a webhook.
- n8n is the workflow engine that decides what to do and generates the final response.

Apps Script is responsible for receiving an event, calling n8n, and returning the response. That's it. The complexity stays in n8n, where it's easier to visualize, debug, and iterate.

![Gemini_Generated_Image_f3sipbf3sipbf3si](https://github.com/user-attachments/assets/fcf1eb22-d9cc-4f35-b6b7-99b8647a632d)

---

## What the Google quickstart gives you (and why it matters)

Google's quickstart isn't just "hello world." It establishes the core mechanics you must have for any serious Chat integration:
1. Google Chat sends structured event payloads when a user messages your app -- these events contain the message text and context.
2. Apps Script can act as the Chat app endpoint via a deployment that Google Chat calls.
3. Whatever Apps Script returns is rendered back into Chat, so you can treat Apps Script as a request/response bridge.

Once you have this loop working, swapping the response logic from "echo" to "call n8n and return its output" is a clean, natural extension -- exactly the kind of extension this architecture is designed for.

---

## The end-to-end flow, in real terms

Let's describe what happens when a user types a message to your Chat app -- because the connector only makes sense when you understand the hop-by-hop chain:

A user opens Google Chat, finds your app, and sends a message. That message isn't delivered to n8n directly; it first hits Google Chat's app framework. Google Chat then invokes your Apps Script deployment and hands it an event payload (the "what happened" object).

Apps Script receives that payload and does a small amount of work:
- It extracts what you care about (message text, user identity, space identity, maybe thread context).
- It reshapes that into a clean request body.
- It calls your n8n webhook endpoint.
- It waits for n8n to respond.

n8n receives the request and runs your workflow: it can route based on keywords, call internal systems, hit external APIs, perform transformations, and decide what the "final answer" should be. It returns that output to Apps Script, and Apps Script returns it back to Google Chat in the expected response format -- so the user sees a reply from the Chat app.

This is the connector in one paragraph: Chat event in, webhook out, webhook response back, Chat response rendered.

Chat Conversation:


<img width="325" height="417" alt="IMG_6396" src="https://github.com/user-attachments/assets/e45ba205-dba1-42fd-b797-fcf9c8319947" />

N8N Workflow:


<img width="1832" height="822" alt="image" src="https://github.com/user-attachments/assets/cf419727-8a4c-4b75-bb56-c7d75da911bd" />


---

Your workflow can be minimal at first -- just return a simple reply string. The important thing is that the workflow returns a consistent output shape that Apps Script can reliably pass back to Chat.

In this build, the workflow uses an n8n AI Agent with a "Get Google Sheet Rows" tool:
- Google Sheet columns: vehicle_number, owner_name, email, phone_number
- User input: the vehicle number typed in Google Chat
- Agent behavior: search for the vehicle number in the sheet and return the owner's name and phone number (and optionally the email)
- Response shape: a single reply text string that Apps Script can pass back to Chat

That keeps the connector logic simple: Chat delivers the vehicle number, n8n resolves it, Apps Script returns the reply.

---
