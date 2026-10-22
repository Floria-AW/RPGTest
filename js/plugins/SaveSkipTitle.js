//=============================================================================
// SafeSkipTitle.js (完美防闪退版 - 开局直达地图)
//=============================================================================

/*:
 * @plugindesc 安全跳过标题画面，避免因数据未加载完而闪退。
 * @author 诺贝利 & 妖猫星夜
 *
 * @help
 * 确保在插件管理器中开启。
 */

(function() {
    // 监听标题场景的创建：当游戏准备显示标题时，我们瞬间拦截并安全进入新游戏
    var _Scene_Title_create = Scene_Title.prototype.create;
    Scene_Title.prototype.create = function() {
        // 如果是战斗测试或事件测试，走原逻辑
        if (DataManager.isBattleTest() || DataManager.isEventTest()) {
            _Scene_Title_create.call(this);
            return;
        }

        // 1. 初始化新游戏的数据（角色、队伍、物品、初始位置）
        DataManager.setupNewGame();
        
        // 2. 检查玩家初始地图坐标是否存在
        this.checkPlayerLocation();
        
        // 3. 安全切入地图场景，彻底告别标题和闪退！
        SceneManager.goto(Scene_Map);
    };

    // 辅助函数：确保初始化时能正确读取玩家出生点
    Scene_Title.prototype.checkPlayerLocation = function() {
        if ($dataSystem.startMapId === 0) {
            throw new Error('【错误】初始地图未设置！请在 RPG Maker 编辑器的“系统”中设置起始位置。');
        }
    };
})();