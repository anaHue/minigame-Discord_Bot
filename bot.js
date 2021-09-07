import { Client, Intents, GuildManager } from 'discord.js';
import dotenv from 'dotenv';
import randomWord from 'random-words';
import moment from 'moment';

dotenv.config({path: './config.env'});

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

let mapUserMoney = new Map();
let hangmanGames = new Map();

client.on('ready', () => {
    const guilds = client.guilds.cache.toJSON();
    let members;
    guilds.forEach(async (guild) => {
        members = await guild.members.fetch();
        members = members.toJSON();
        members.forEach((member) => {
            if(!mapUserMoney.has(member.user.id) && !member.user.bot){
                mapUserMoney.set(member.user.id, {money: 0, nextRewardDate: moment()});
            }
        });

        console.log(mapUserMoney);
    });

    //guilds[0].members.fetch().then((data) => console.log(data));
})

client.on('messageCreate', async (msg) => {

    const originChannel = client.channels.cache.get(msg.channelId);

    const args = msg.content.split(' ');

    if(args[0] == "!daily"){
        if(moment().isAfter(mapUserMoney.get(msg.author.id).nextRewardDate)){
            mapUserMoney.get(msg.author.id).money += 100;
            mapUserMoney.get(msg.author.id).nextRewardDate = moment(new Date()).add(1, 'day');
            originChannel.send({ content: "You received 100 coins !", reply: { messageReference: msg.id }})
            console.log(mapUserMoney)
        } else{
            const nextRewardDate = mapUserMoney.get(msg.author.id).nextRewardDate;
            console.log(nextRewardDate);
            console.log(moment());
            let remainingTime = moment(nextRewardDate - moment());
            let remainingHours;

            if(remainingTime.get('hours') == 0 && remainingTime.get('day') > 0){
                remainingHours = 23;
            }

            // .format('H[ hour(s)] m[ minute(s)] s[ second(s) ago.]')
            remainingTime = remainingHours + remainingTime.format(" : m : s");


            originChannel.send({ content: "Your next reward will be in "  + remainingTime, reply: { messageReference: msg.id }})
        }
    }

    if(args[0] == "!8ball"){
        let answers = ['Yes !', 'No !', 'Maybe', 'Probably', 'Probably not'];
        let index = Math.floor(Math.random() * answers.length);

        originChannel.send({ content: answers[index], reply: { messageReference: msg.id }})
    }

    if(args[0] == "!coin"){
        let faces = ['Heads', 'Tails'];
        let index = Math.floor(Math.random() * faces.length);
        originChannel.send({ content: faces[index], reply: { messageReference: msg.id }});
    }

    if(args[0] == "!hangman"){
        if(!hangmanGames.get(msg.author.username)){
            let wordSolution;

            while(!wordSolution || wordSolution.length < 4){
                wordSolution = randomWord({exactly: 1, maxLength: 16})[0];
            }

            let wordToGuess = "";
            wordSolution.split("").forEach(() => {
                wordToGuess += "-";
            });

            originChannel.send({ content: wordToGuess + ` in ${wordToGuess.length} letters (you have 10 attempts)`, reply: { messageReference: msg.id }});
        
            hangmanGames.set(msg.author.username, {solution: wordSolution, lettersSent: new Set(), attemps: 10});

            console.log(hangmanGames.get(msg.author.username).solution);
        } else{
            if (!args[1]) {
                originChannel.send({ content: `no letters / word given or you are in a not finished game`, reply: { messageReference: msg.id }});
                return;
            }
            
            if(args[1].length > 1) {
                if(args[1] == hangmanGames.get(msg.author.username).solution) originChannel.send({ content: `You won ! The word was ${args[1]}`, reply: { messageReference: msg.id }});
                else {
                    hangmanGames.get(msg.author.username).attemps--;
                    originChannel.send({ content: `That wasn't the word ! (you still have ${hangmanGames.get(msg.author.username).attemps} attemps)`, reply: { messageReference: msg.id }});
                }
            } else{
                let wordToGuess = "";
                hangmanGames.get(msg.author.username).solution.split("").forEach((letter) => {
                    if(letter == args[1] || hangmanGames.get(msg.author.username).lettersSent.has(letter)) wordToGuess += letter;
                    else wordToGuess += "-";
                });

                if(hangmanGames.get(msg.author.username).solution.includes(args[1])) {
                    hangmanGames.get(msg.author.username).lettersSent.add(args[1]);
                    originChannel.send({ content: `This letter is in the word ! ${wordToGuess} (you still have ${hangmanGames.get(msg.author.username).attemps} attemps)`, reply: { messageReference: msg.id }});
                } else{
                    hangmanGames.get(msg.author.username).attemps--;
                    originChannel.send({ content: `This letter is not in the word... ${wordToGuess} (you still have ${hangmanGames.get(msg.author.username).attemps} attemps)`, reply: { messageReference: msg.id }});
                }
            }
        }
    }

    if(args[0] == "!minigames"){
        originChannel.send(`
        -----------------------------------------------------\n° !8ball - generate an answer to your question\n° !coin - throw a coin\n° !hangman - start a hangman (not finished)\n-----------------------------------------------------
        `);
    }
});

client.login(process.env.TOKEN);