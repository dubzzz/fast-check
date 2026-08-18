import {unified} from 'unified';
import remarkParse from 'remark-parse';
import directive from 'remark-directive';
const md = `:::info Some Title\nbody\n:::\n\n:::info[Some Title]\nbody\n:::\n\n:::tip Test your custom \`toString\`\nbody\n:::\n`;
const tree = unified().use(remarkParse).use(directive).parse(md);
const t2 = await unified().use(remarkParse).use(directive).run(tree);
console.log(JSON.stringify(t2.children.map(c=>({type:c.type,name:c.name, first: c.children?.[0]?.type, raw: c.type==='paragraph'? c.children.map(x=>x.value||x.type).join('|'):undefined})),null,1));
