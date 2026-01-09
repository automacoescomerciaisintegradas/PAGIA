/**
 * Ralph Wiggum Say Command
 * Makes Ralph say something random
 */

export default async function ralphSayCommand(context) {
    const ralphQuotes = [
        "I'm in danger!",
        "Hello, everybody, and welcome to my trial!",
        "I'm not a cop, I'm a republican!",
        "My cat's name is Snowball, and I have it on good authority that it's a racist.",
        "I'm a very important person. I have many leather-bound books and my apartment smells of rich mahogany.",
        "I'm not a cop, I'm a Republican!",
        "They came from behind!",
        "I'm in the band, I play the sharp instruments.",
        "I know what you're thinking: 'Ralph, why are you so awesome?' The answer is: 'I don't know.'",
        "I'm not a cop, I'm a Republican!"
    ];
    
    const randomQuote = ralphQuotes[Math.floor(Math.random() * ralphQuotes.length)];
    
    return {
        message: `Ralph says: "${randomQuote}"`,
        success: true
    };
}