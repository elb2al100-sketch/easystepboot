/**
 * TicTacToe Game Class / فئة لعبة إكس-أو (تيك تاك تو)
 */
class TicTacToe {
    constructor(playerX = 'x', playerO = 'o') {
        this.playerX = playerX   // Player X symbol / رمز اللاعب X
        this.playerO = playerO   // Player O symbol / رمز اللاعب O
        this._currentTurn = false // false = X turn, true = O turn / الدور الحالي
        this._x = 0              // Bitboard for X / لوح البت للاعب X
        this._o = 0              // Bitboard for O / لوح البت للاعب O
        this.turns = 0           // Total turns / عدد الحركات
    }

    // Get the combined board (occupied positions) / الحصول على اللوح الكامل (المربعات المشغولة)
    get board() {
        return this._x | this._o
    }

    // Get the symbol of the current player / الحصول على اللاعب الحالي
    get currentTurn() {
        return this._currentTurn ? this.playerO : this.playerX
    }

    // Get the symbol of the enemy player / الحصول على اللاعب المنافس
    get enemyTurn() {
        return this._currentTurn ? this.playerX : this.playerO
    }

    // Check if a bitboard is a winning combination / التحقق من وجود فوز
    static check(state) {
        // Winning combinations in binary / التراكيب الفائزة بالبت
        for (let combo of [7, 56, 73, 84, 146, 273, 292, 448])
            if ((state & combo) === combo)
                return true // Win / فوز
        return false
    }

    /**
     * Convert (x,y) coordinates to bitboard / تحويل الإحداثيات إلى لوح البت
     * ```js
     * TicTacToe.toBinary(1, 2) // 0b010000000
     * ```
     */
    static toBinary(x = 0, y = 0) {
        if (x < 0 || x > 2 || y < 0 || y > 2) throw new Error('invalid position') // Invalid position / موقع غير صالح
        return 1 << x + (3 * y)
    }

    /**
     * Make a move / تنفيذ حركة
     * @param player `0` is `X`, `1` is `O` / اللاعب 0 = X ، 1 = O
     * 
     * Returns codes:
     * - `-3` Game Ended / انتهت اللعبة
     * - `-2` Invalid Turn / الدور غير صالح
     * - `-1` Invalid Position / موقع غير صالح
     * - ` 0` Position Occupied / الموقع مشغول
     * - ` 1` Success / تم بنجاح
     * @returns {-3|-2|-1|0|1}
     */
    turn(player = 0, x = 0, y) {
        if (this.board === 511) return -3 // Board full / اللوح ممتلئ
        let pos = 0
        if (y == null) {
            if (x < 0 || x > 8) return -1
            pos = 1 << x
        } else {
            if (x < 0 || x > 2 || y < 0 || y > 2) return -1
            pos = TicTacToe.toBinary(x, y)
        }
        if (this._currentTurn ^ player) return -2 // Wrong turn / دور غير صحيح
        if (this.board & pos) return 0 // Already occupied / مشغول
        this[this._currentTurn ? '_o' : '_x'] |= pos // Place the move / وضع الحركة
        this._currentTurn = !this._currentTurn // Switch turn / تبديل الدور
        this.turns++
        return 1
    }

    /**
     * Render board from bitboards / عرض اللوح من البت
     * @returns {('X'|'O'|1|2|3|4|5|6|7|8|9)[]}
     */
    static render(boardX = 0, boardO = 0) {
        let x = parseInt(boardX.toString(2), 4)
        let y = parseInt(boardO.toString(2), 4) * 2
        return [...(x + y).toString(4).padStart(9, '0')].reverse().map((value, index) => 
            value == 1 ? 'X' : value == 2 ? 'O' : ++index
        )
    }
    
    // Render current board / عرض اللوح الحالي
    render() {
        return TicTacToe.render(this._x, this._o)
    }

    // Get the winner / الحصول على الفائز
    get winner() {
        let x = TicTacToe.check(this._x)
        let o = TicTacToe.check(this._o)
        return x ? this.playerX : o ? this.playerO : false
    }
}

new TicTacToe().turn // Reference to method / مثال: استدعاء الطريقة

module.exports = TicTacToe