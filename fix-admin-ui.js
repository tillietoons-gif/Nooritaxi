const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Replace <main className="min-h-screen with <main className="flex-1
            content = content.replace(/<main className="min-h-screen /g, '<main className="flex-1 ');

            // Replace <div className="flex min-h-screen flex-col bg-background/50"> with <div className="flex flex-1 flex-col">
            content = content.replace(/<div className="flex min-h-screen flex-col bg-background\/50">/g, '<div className="flex flex-1 flex-col">');

            // Replace <div className="flex min-h-screen flex-col bg-background"> with <div className="flex flex-1 flex-col">
            content = content.replace(/<div className="flex min-h-screen flex-col bg-background">/g, '<div className="flex flex-1 flex-col">');

            // Replace <div className="flex min-h-screen flex-col bg-muted/20"> with <div className="flex flex-1 flex-col">
            content = content.replace(/<div className="flex min-h-screen flex-col bg-muted\/20">/g, '<div className="flex flex-1 flex-col">');

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated', fullPath);
            }
        }
    }
}

processDir('./web/src/app/admin');
