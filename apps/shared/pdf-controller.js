// Shared PDF controller

import { createPdf }
  from "./pdf-engine.js";

async function generatePdfForGame(gameId) {
  const game = GAME_LIST.find(g => g.id === gameId);
  const template = TEMPLATE_LIST[selectedTemplateIndex];

  const bytes = await createPdf({ game, template });
  saveAs(new Blob([bytes], { type: "application/pdf" }),
         `Game-${game.game_number || gameId}.pdf`);
}

async function generateLineupPDFs() {
  const team = TeamStore.getCurrentTeam();
  const template = TEMPLATE_LIST[selectedTemplateIndex];

  const zip = new JSZip();

  for (const game of GAME_LIST.filter(g => g.selected)) {
    const bytes = await createPdf({ game, team, template });
    zip.file(`${team.teamName}-vs-${game.home_team}.pdf`, bytes);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${team.teamName}-Cards.zip`);
}

window.generatePdfForGame = generatePdfForGame;
window.generateLineupPDFs = generateLineupPDFs;
