//MINIMAL SUBSCRIBE LeonGanz
import { ChatGPTAPI } from "chatgpt";
import dotenv from "dotenv";
import { marked } from "marked";
import { Telegraf } from "telegraf";
import express from "express";

dotenv.config();

let conversation = null;
const app = express();
const port = process.env.PORT ? process.env.PORT : 8080;
let start = Date.now();

console.log("starting:", start);

const api = new ChatGPTAPI({
  apiKey: process.env.APIKEY,
});

const bot = new Telegraf(process.env.TOKEN);

bot.start((ctx) => {
  ctx.reply(
    "Hai, Saya adalah SmartBoda, saya dapat membantu anda menjawab pertanyaan dengan cara ketik `/ask pertanyaan`\n \n bot ini di kembangkan oleh rama agung supriyadi"
  );
});

async function askAI(question, userId) {
  conversation = conversation
    ? await api.sendMessage(question, {
      conversationId: conversation.conversationId,
      parentMessageId: conversation.messageId,
    })
    : await api.sendMessage(question);

  console.log(conversation.text);

  return conversation.text;
}

bot.command("ask", async (ctx) => {
  const userId = ctx.update.message.from.id;

  if (ctx.update.message.from.is_bot) {
    return false;
  }

  const args = ctx.update.message.text.split(" ");
  args.shift();
  let question = args.join(" ");

  if (question.length == 0) {
    return ctx.reply("Ketik suatu pertanyaan setelah ``/ask` untuk menanyakan sesuatu kepada saya.", {
      reply_to_message_id: ctx.message.message_id,
    });
  }

  ctx.sendChatAction("typing");

  try {
    const completion = await askAI(question, userId);

    ctx.reply(marked.parseInline(completion), {
      reply_to_message_id: ctx.message.message_id,
      parse_mode: "HTML",
    });
  } catch (error) {
    console.log(error);
  }
});

bot.command("reload", async (ctx) => {
  chat_log.clear();

  ctx.sendChatAction("typing");

  if (chat_log.size === 0) {
    return ctx.reply("Conversation history reloaded!", {
      reply_to_message_id: ctx.message.message_id,
    });
  }
});
app.get("/", (req, res) => {
  res.send("Welcome to SmartBoda Rest Api");
});

app.get("/chat/:userId/:message", (req, res) => {
  if (req.params.message && req.params.userId) {
    askAI(req.params.message, req.params.userId)
      .then((reply) => res.send({ reply }))
      .catch((err) => console.log(err));
  } else {
    res.send({ reply: "ChatGPT error..." });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

