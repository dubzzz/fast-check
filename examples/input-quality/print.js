function printSample(label, extract) {
    console.log(`Sample: ${label}`);
    for (const item of extract) {
        if (typeof item == 'object')
            console.log(`\t${JSON.stringify(item)}`);
        else
            console.log(`\t${item}`);
    }
}

module.exports = { printSample };