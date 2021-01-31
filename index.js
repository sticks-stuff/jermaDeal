const Discord = require('discord.js');
const parseCurrency = require('parsecurrency');
const parseTime = require('parse-duration');
const fs = require("fs");

const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

const LocalDatabase = require("./LocalDatabase");

const yesEmoji = "✅";
const noEmoji = "❌";
const channel = "deals";

const filterReacts = (reaction) => (reaction.emoji.name === yesEmoji || reaction.emoji.name === noEmoji) && reaction.message.channel.name === channel && message.author.bot != true;

require('dotenv').config();

function parseMessage(message) {
    var time = ""; //dummy variable in case it doesn't get set
    var type = ""; //TODO: add types
    var challenge = null;
    var worth = null;
    var positive = 0;
    var negative = 0;
    messageLines = message.split("\n");

    var errorMessage = new Array();

    if(messageLines.length < 1) {
        errorMessage.push("Formatting Incorrect. The correct formatting is: \n Challenge: \n (Optional) Time: \n Worth: ");
        return errorMessage;
    }

    for(i = 0; i < messageLines.length; i++){
        var lineValue = messageLines[i].split(": ");
        switch(lineValue[0].toLowerCase()) {
            case("challenge"): {
                console.log("Challenge is " + lineValue[1]);
                challenge = lineValue[1];
                break;
            }
            case("time"): {
                try {
                    var parsedTime = parseTime(lineValue[1], 'ms'); //set format
                    console.log("Time is (in milliseconds) " + parsedTime);
                    time = parsedTime;
                    if(time == null) {
                        errorMessage.push("Couldn't parse a time out of your submission!");
                    }
                } catch (e) {
                    errorMessage.push("Not a valid time");
                    break;
                }
                break;
            }
            case("worth"): {
                try {
                    var money = parseCurrency(lineValue[1]);
                    console.log("Money is " + money.value);
                    worth = money.value;
                } catch (e) {
                    errorMessage.push("Not a valid money declaration");
                    break;
                }
                break;
            }
            default: {
                var description = lineValue[1];
                break;
            }
        }
    }
    if(errorMessage.length > 0) {
        console.log("bad message");
        console.log(errorMessage);
        return errorMessage;
    }
    else{
        
        try {
            return new Object({challenge, time, worth, type, positive, negative});
        } catch (e) {
            errorMessage.push("Formatting Incorrect. The correct formatting is: \n Challenge: \n (Optional) Time: \n Worth: ");
            return errorMessage;
        }
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const fakeDelete = new Array([]);

client.on('message', async (message) => {
    if (message.content.startsWith("!deal dump")) { //DEBUG
        let db = JSON.parse(fs.readFileSync("./db.json")) || {}; //DEBUG
        message.channel.send("```\n" + JSON.stringify(db) + "```"); //DEBUG
    } else { //DEBUG
    if(message.channel.name === channel && message.author.bot != true) {
        if(LocalDatabase.Get(message.author.id) === null) {
            console.log(message.channel.name);
            var messageObject = parseMessage(message.content);
            if(Array.isArray(messageObject) === true) {
                message.author.send(messageObject.join("\n"));
                message.delete();
            } else {
                LocalDatabase.Set(message.author.id, messageObject);
                console.log(message.author.id);
                message.react("✅");
                message.react("❌");
                // message.createReactionCollector(filter);
            }
        } else {
            message.author.send("One submission per person please!\nYou may delete and resubmit as many times as you like however.");
            fakeDelete.push(message.author.id);
            message.delete();
        }
    }
    } //DEBUG
});


client.on('messageDelete', async (message) => {
    if (message.partial) {
            try {
                await message.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                LocalDatabase.Set(message.author.id, null);
                return;
            }
        }
    if(message.channel.name === channel && message.author.bot != true) {
        if(fakeDelete.includes(message.author.id)) {
            var index = fakeDelete.indexOf(message.author.id);
            if (index > -1) {
                fakeDelete.splice(index, 1);
            }
        }
        else if(await LocalDatabase.Get(message.author.id) != null) {
            LocalDatabase.Set(message.author.id, null);
        }
    }
});

client.on('messageReactionAdd' || 'messageReactionRemove'.filter(filterReacts), async (reaction) => {
	// When we receive a reaction we check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
    }
    // console.log(reaction.message.author.id);
    try {
        messageObject = LocalDatabase.Get(reaction.message.author.id);
        switch(reaction.emoji.name){
            case(yesEmoji): {
                messageObject.positive = reaction.count;
                LocalDatabase.Set(reaction.message.author.id, messageObject);
                break;
            }
            case(noEmoji): {
                messageObject.negative = reaction.count;
                LocalDatabase.Set(reaction.message.author.id, messageObject);
                break;
            }
            default: {
                console.log("Someone reacted with an emote thats not counted monkuh ess");
            }
        }
    }
    catch (e) {
        console.log("Person reacted to is not in DB!!"); //TODO add it if its not in there
        var newMessageObject = parseMessage(reaction.message.content);
        if(Array.isArray(newMessageObject) === true) {
            reaction.message.author.send(newMessageObject.join("\n"));
            reaction.message.delete();
        } else {
            LocalDatabase.Set(reaction.message.author.id, newMessageObject);
            console.log(reaction.message.author.id);
            reaction.message.react("✅");
            reaction.message.react("❌");
            // message.createReactionCollector(filter);
        }

    }
});

client.login(process.env.discordToken);
