}

    if (fitur.detectblacklist && fitur.detectblacklist2) {
      const status = user.status;
      if (status === "blacklist") {
        return false; // [EN] Stop processing if user is blacklisted
        // [AR] إيقاف المعالجة إذا كان المستخدم في القائمة السوداء
      }
    }

    // [EN] Badword detection
    // [AR] كشف الكلمات البذيئة
    if (!isAdmin && fitur.badwordv3 && command !== "delbadword") {
      const hasBadwordGroup = await containsBadword(remoteJid, fullText);
      const hasBadwordGlobal = await containsBadword("global-badword", fullText);

      if (hasBadwordGroup.status || hasBadwordGlobal.status) {
        logWithTime("SYSTEM", `Badword V3 feature detected`);
        await deleteMessage();

        const detectWords = hasBadwordGroup.words || hasBadwordGlobal.words;
        const result = badwordDetection(sender);

        if (result.status === "warning") {
          if (mess.handler.badword_warning) {
            let warningMessage = mess.handler.badword_warning
              .replace("@sender", `@${sender.split("@")[0]}`)
              .replace("@warning", result.totalWarnings)
              .replace("@detectword", detectWords)
              .replace("@totalwarning", config.BADWORD.warning);

            await sendText(warningMessage, true);
          }
          return false;
        }

        if (result.status === "blocked") {
          if (mess.handler.badword_block) {
            let warningMessage = mess.handler.badword_block
              .replace("@sender", `@${sender.split("@")[0]}`)
              .replace("@warning", result.totalWarnings)
              .replace("@detectword", detectWords)
              .replace("@totalwarning", config.BADWORD.warning);

            await sendText(warningMessage, true);
            await kickParticipant();
          }
        }
      }
    }

    // [EN] Basic badword detection
    // [AR] كشف الكلمات البذيئة الأساسي
    if (!isAdmin && fitur.badword && command !== "delbadword") {
      const hasBadwordGroup = await containsBadword(remoteJid, fullText);
      const hasBadwordGlobal = await containsBadword("global-badword", fullText);

      if (hasBadwordGroup.status || hasBadwordGlobal.status) {
        const detectWords = hasBadwordGroup.words || hasBadwordGlobal.words;
        logWithTime("SYSTEM", `Badword feature detected`);
        await deleteMessage();

        const result = badwordDetection(sender);

        if (result.status === "warning") {
          if (mess.handler.badword_warning) {
            let warningMessage = mess.handler.badword_warning
              .replace("@sender", `@${sender.split("@")[0]}`)
              .replace("@warning", result.totalWarnings)
              .replace("@detectword", detectWords)
              .replace("@totalwarning", config.BADWORD.warning);

            await sendText(warningMessage, true);
          }
          return false;
        }

        if (result.status === "blocked") {
          if (mess.handler.badword_block) {
            let warningMessage = mess.handler.badword_block
              .replace("@sender", `@${sender.split("@")[0]}`)
              .replace("@warning", result.totalWarnings)
              .replace("@detectword", detectWords)
              .replace("@totalwarning", config.BADWORD.warning);

            await sendText(warningMessage, true);
          }

          const badwordAction = config.BADWORD.action.toLowerCase().trim();

          try {
            await handleAction(badwordAction, sender);
          } catch (error) {
            console.error("Error processing badword action:", error);
            await sendText("❗ _Error occurred, badword action failed._");
          }
        }
        return false;
      }
    }

    // [EN] Badword V2 detection
    // [AR] كشف الكلمات البذيئة V2
    if (!isAdmin && fitur.badwordv2 && command !== "delbadword") {
      const hasBadwordGroup = await containsBadword(remoteJid, fullText);
      const hasBadwordGlobal = await containsBadword("global-badword", fullText);

      if (hasBadwordGroup.status || hasBadwordGlobal.status) {
        logWithTime("SYSTEM", `Badword V2 feature detected`);
        await deleteMessage();

        const detectWords = hasBadwordGroup.words || hasBadwordGlobal.words;
        const result = badwordDetection(sender);

        if (mess.handler.badword_block) {
          let warningMessage = mess.handler.badword_block
            .replace("@sender", `@${sender.split("@")[0]}`)
            .replace("@warning", result.totalWarnings)
            .replace("@detectword", detectWords)
            .replace("@totalwarning", config.BADWORD.warning);

          await sendText(warningMessage, true);
        }

        const badwordAction = config.BADWORD.action.toLowerCase().trim();
        try {
          await handleAction(badwordAction, sender);
        } catch (error) {
          console.error("Error processing badword action:", error);
          await sendText("❗ _Error occurred, badword action failed._");
        }

        return false;
      }
    }

    // [EN] Anti-game detection
    // [AR] كشف الألعاب المحظورة
    if (fitur.antigame && command) {
      const Games = [
        "bj","blackjack","caklontong","kodam","cekkodam","snakes","dare",
        "family100","kuismath","math","suit","tebakangka","tebakbendera",
        "tebakbom","tebakgambar","tebakhewan","tebakkalimat","tebakkata",
        "tebaklagu","tebak","tebaklirik","tictactoe","truth","ttc","ttt",
      ];
      if (Games.some((game) => command.includes(game))) {
        const notifKey = `antigame-${remoteJid}-${sender}`;
        if (!notifiedUsers.has(notifKey)) {
          notifiedUsers.add(notifKey);
          await sendText(mess.game.isStop);
        }
        return false;
      }
    }