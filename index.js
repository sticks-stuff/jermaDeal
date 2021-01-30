const Discord = require('discord.js');
const parseCurrency = require('parsecurrency');
const parseTime = require('parse-duration');

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
                    var parsedTime = parseTime(lineValue[1]);
                    console.log("Time is (in seconds) " + parsedTime);
                    time = parsedTime;
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
        positive = 0;
        negative = 0;
        return new Object({challenge, time, worth, type, positive, negative});
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (message) => {
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
            message.delete();
        }
    }
});

//THIS CODE BELOW IS FOR MODS DELETING MESSAGES (I CANT REALLY FIGURE OUT HOW TO IMPLEMENT IT PROPERLY BUT IT DOESN'T MATTER ANYWAY CUZ THIS IS A PROTOTYPE LUL)

// client.on('messageDelete', async (message) => {
//     if(message.channel.name === channel && message.author.bot != true) {
//         if (message.partial) {
//             // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
//             try {
//                 await message.fetch();
//             } catch (error) {
//                 console.error('Something went wrong when fetching the message: ', error);
//                 // Return as `reaction.message.author` may be undefined/null
//                 return;
//             }
//         }
//     }
//     if(await LocalDatabase.Get(message.author.id) != null) {
//         LocalDatabase.Set(message.author.id, null);
//     }
// });

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
    }
});

client.login(process.env.discordToken);
