import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Copy skill files from the /skills directory to the /docs directory
 * and add appropriate frontmatter for Docusaurus
 */
async function copySkills() {
  const skillsDir = join(import.meta.dirname, '..', '..', 'skills');
  const docsDir = join(import.meta.dirname, '..', 'docs');

  // Define skills to copy with their target configuration
  const skills = [
    {
      sourcePath: join(skillsDir, 'javascript-testing-expert', 'SKILL.md'),
      targetPath: join(docsDir, 'javascript-testing-expert.md'),
      frontmatter: {
        sidebar_position: 9,
        slug: '/javascript-testing-expert/',
        sidebar_label: 'JavaScript Testing Expert',
      },
    },
  ];

  for (const skill of skills) {
    if (!existsSync(skill.sourcePath)) {
      console.warn(`Warning: Skill file not found at ${skill.sourcePath}`);
      continue;
    }

    // Read the source skill file
    const sourceContent = await readFile(skill.sourcePath, 'utf-8');

    // Remove existing frontmatter if present (between --- delimiters)
    let contentWithoutFrontmatter = sourceContent;
    const frontmatterRegex = /^---\n[\s\S]*?\n---\n/;
    if (frontmatterRegex.test(sourceContent)) {
      contentWithoutFrontmatter = sourceContent.replace(frontmatterRegex, '');
    }

    // Build new frontmatter
    const frontmatterLines = ['---'];
    for (const [key, value] of Object.entries(skill.frontmatter)) {
      if (typeof value === 'number') {
        frontmatterLines.push(`${key}: ${value}`);
      } else {
        frontmatterLines.push(`${key}: "${value}"`);
      }
    }
    frontmatterLines.push('---');
    frontmatterLines.push('');

    const newContent = frontmatterLines.join('\n') + contentWithoutFrontmatter;

    // Write the file to docs directory
    await writeFile(skill.targetPath, newContent, 'utf-8');
    console.log(`Copied skill from ${skill.sourcePath} to ${skill.targetPath}`);
  }
}

copySkills();
