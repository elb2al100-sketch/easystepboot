class TicTacToe {
    /**
     * @param playerX Symbol for X / رمز اللاعب X
     * @param playerO Symbol for O / رمز اللاعب O
     */
    constructor(playerX = 'x', playerO = 'o') {
        this.playerX = playerX
        this.playerO = playerO
        this._currentTurn = false  // false = X turn / الدور لـ X، true = O turn / الدور لـ O
        this._x = 0                // Bitboard for X / لوحة بت للـ X
        this._o = 0                // Bitboard for O / لوحة بت للـ O
        this.turns = 0             // Number of turns / عدد الأدوار
    }

    // ==============================
    // Board Status / حالة اللوحة
    // ==============================
    get board() {
        return this._x | this._o // Combine X and O / دمج X و O
    }

    get currentTurn() {
        return this._currentTurn ? this.playerO : this.playerX // Current player / اللاعب الحالي
    }

    get enemyTurn() {
        return this._currentTurn ? this.playerX : this.playerO // Other player / اللاعب الآخر
    }

    // ==============================
    // Check Win / تحقق من الفوز
    // ==============================
    static check(state) {
        for (let combo of [7, 56, 73, 84, 146, 273, 292, 448]) // Winning combos / خطوط الفوز
            if ((state & combo) === combo) return true
        return false
    }

    // ==============================
    // Convert coordinates to bit / تحويل الإحداثيات إلى بت
    // ==============================
    static toBinary(x = 0, y = 0) {
        if (x < 0 || x > 2 || y < 0 || y > 2) throw new Error('invalid position')
        return 1 << x + (3 * y)
    }

    // ==============================
    // Make a Turn / تنفيذ الدور
    // ==============================
    /**
     * @param player 0 = X, 1 = O / 0 = X، 1 = O
     * @returns {-3|-2|-1|0|1} Status
     */
    turn(player = 0, x = 0, y) {
        if (this.board === 511) return -3 // Board full / انتهت اللعبة
        let pos = 0
        if (y == null) { // Single index / رقم واحد
            if (x < 0 || x > 8) return -1
            pos = 1 << x
        } else { // (x, y) coordinates / إحداثيات (x,y)
            if (x < 0 || x > 2 || y < 0 || y > 2) return -1
            pos = TicTacToe.toBinary(x, y)
        }
        if (this._currentTurn ^ player) return -2 // Wrong player / اللاعب الخطأ
        if (this.board & pos) return 0             // Position occupied / المكان محجوز
        this[this._currentTurn ? '_o' : '_x'] |= pos // Place move / وضع العلامة
        this._currentTurn = !this._currentTurn      // Switch turn / تبديل الدور
        this.turns++
        return 1 // Success / تم بنجاح
    }

    // ==============================
    // Render Board / عرض اللوحة
    // ==============================
    static render(boardX = 0, boardO = 0) {
        let x = parseInt(boardX.toString(2), 4)
        let y = parseInt(boardO.toString(2), 4) * 2
        return [...(x + y).toString(4).padStart(9, '0')]
               .reverse()
               .map((value, index) => value == 1 ? 'X' : value == 2 ? 'O' : ++index)
    }

    render() {
        return TicTacToe.render(this._x, this._o)
    }

    // ==============================
    // Winner / الفائز
    // ==============================
    get winner() {
        let x = TicTacToe.check(this._x)
        let o = TicTacToe.check(this._o)
        return x ? this.playerX : o ? this.playerO : false
    }
}

module.exports = TicTacToe