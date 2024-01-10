export function capitalizeText(text: string): string {
    return text.split(' ').map(word => {
        const capitalized = word.at(0)?.toUpperCase();
        return capitalized + word.slice(1);
    }).join(' ');
}

export function extractNumber(text: string): number {
    const allNum = text.matchAll(/[0-9]+/g);
    let resultStr = '';
    for (const num of allNum) {
        resultStr += num;
    }
    return parseInt(resultStr);
}