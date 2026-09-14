import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch/comparison_result.json', 'utf-8'));

let txtContent = '';

txtContent += `================================================================================\n`;
txtContent += `                 მოსწავლეთა სიის შედარების რეპორტი (2026.xls vs საიტი)\n`;
txtContent += `================================================================================\n\n`;

txtContent += `📊 ზოგადი სტატისტიკა:\n`;
txtContent += `--------------------------------------------------------------------------------\n`;
txtContent += `• სულ მოსწავლე ექსელის ფაილში (2026.xls): ${data.excelCount}\n`;
txtContent += `• სულ მოსწავლე საიტის მონაცემთა ბაზაში: ${data.dbCount}\n`;
txtContent += `• ექსელში არის, მაგრამ საიტზე არ არის: ${data.inExcelNotInDbCount} მოსწავლე (ახალი/დასამატებელი)\n`;
txtContent += `• საიტზე არის, მაგრამ ექსელში არ არის: ${data.inDbNotInExcelCount} მოსწავლე (ყოფილი/არალიცენზირებული/წინა წლების)\n`;
txtContent += `--------------------------------------------------------------------------------\n\n`;

txtContent += `================================================================================\n`;
txtContent += `1. მოსწავლეები, რომლებიც არიან ექსელში (2026.xls), მაგრამ არ არიან საიტზე (${data.inExcelNotInDbCount} მოსწავლე)\n`;
txtContent += `(სტატუსი: მიმდინარე აქტიური მოსწავლეები, რომლებიც ჯერ არ არიან ბაზაში და საჭიროებს საიტზე დამატებას)\n`;
txtContent += `================================================================================\n\n`;

data.inExcelNotInDb.forEach((s: any, idx: number) => {
  const lineNo = String(idx + 1).padStart(2, ' ');
  const pidStr = s.pid ? s.pid : 'არ აქვს პირადი №';
  const sectionStr = s.section ? s.section : 'სექციის გარეშე';
  txtContent += `${lineNo}. ${s.fullName.padEnd(28, ' ')} | პირადი №: ${pidStr.padEnd(12, ' ')} | დამრიგებელი/სექცია: ${sectionStr} (სტრიქონი: ${s.excelRow})\n`;
});

txtContent += `\n================================================================================\n`;
txtContent += `2. მოსწავლეები, რომლებიც არიან საიტზე, მაგრამ არ არიან ექსელში (2026.xls) (${data.inDbNotInExcelCount} მოსწავლე)\n`;
txtContent += `(სტატუსი: წინა წლების/სკოლიდან წასული/კურსდამთავრებული მოსწავლეები, რომლებიც ბაზაში რჩებიან ისტორიის შევსებისთვის, თუმცა 2026 წლის აქტიურ ექსელში აღარ არიან)\n`;
txtContent += `================================================================================\n\n`;

data.inDbNotInExcel.forEach((s: any, idx: number) => {
  const lineNo = String(idx + 1).padStart(3, ' ');
  const pidStr = s.pid ? s.pid : 'არ აქვს პირადი №';
  const classStr = s.className ? s.className : 'კლასის გარეშე';
  txtContent += `${lineNo}. ${s.fullName.padEnd(30, ' ')} | პირადი №: ${pidStr.padEnd(12, ' ')} | კლასი საიტზე: ${classStr}\n`;
});

fs.writeFileSync('მოსწავლეთა_შედარება_2026.txt', txtContent, 'utf-8');
console.log('მოსწავლეთა_შედარება_2026.txt წარმატებით შეიქმნა!');
