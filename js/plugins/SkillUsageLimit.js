//=============================================================================
// SkillUsageLimit.js (技能限制与显示插件 - 完美防报错版)
//=============================================================================

/*:
 * @plugindesc 区分固有/特化技能，支持独立次数限制，并通过插件指令在过主线时刷新。
 * @author 诺贝利 & 妖猫星夜
 *
 * @help
 * 技能备注栏写法：
 * <MaxUse:2>  # 代表该技能拥有独立次数限制，最多使用 2 次
 * 
 * 插件指令：
 * ResetSkillUses   # 在过主线剧情的事件中调用，重置所有队员的技能使用次数
 */

(function() {

    // 1. 监听插件指令，用于过主线时重置次数
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'ResetSkillUses') {
            if ($gameParty && $gameParty.allMembers) {
                $gameParty.allMembers().forEach(function(actor) {
                    if (actor && actor.initSkillUses) {
                        actor.initSkillUses();
                    }
                });
            }
        }
    };

    // 2. 安全地初始化/重置技能次数
    Game_Battler.prototype.initSkillUses = function() {
        this._skillUses = {};
        // 安全获取当前角色的所有技能列表
        var list = [];
        if (this.isActor() && this.actor() && this.actor().skills) {
            list = this.skills ? this.skills() : [];
        } else if (this.skills) {
            list = this.skills();
        }
        
        list.forEach(function(skill) {
            if (skill && skill.meta) {
                var maxUse = Number(skill.meta.MaxUse);
                if (maxUse) {
                    this._skillUses[skill.id] = maxUse;
                }
            }
        }, this);
    };

    // 3. 核心判定：次数耗尽则无法使用
    var _Game_Battler_meetsSkillConditions = Game_Battler.prototype.meetsSkillConditions;
    Game_Battler.prototype.meetsSkillConditions = function(skill) {
        var canUse = _Game_Battler_meetsSkillConditions.call(this, skill);
        if (!canUse) return false;
        
        if (skill && skill.meta) {
            var maxUse = Number(skill.meta.MaxUse);
            if (maxUse) {
                if (!this._skillUses) this.initSkillUses();
                var currentUse = this._skillUses[skill.id];
                if (currentUse === undefined) currentUse = maxUse;
                return currentUse > 0;
            }
        }
        return true;
    };

    // 4. 使用技能后扣除次数
    var _Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        _Game_Battler_useItem.call(this, item);
        if (item && DataManager.isSkill(item) && item.meta) {
            var maxUse = Number(item.meta.MaxUse);
            if (maxUse) {
                if (!this._skillUses) this.initSkillUses();
                if (this._skillUses[item.id] > 0) {
                    this._skillUses[item.id]--;
                }
            }
        }
    };

    // 5. 在技能列表中安全地追加显示 (剩余次数/最大次数)
    var _Window_SkillList_drawItemName = Window_SkillList.prototype.drawItemName;
    Window_SkillList.prototype.drawItemName = function(item, x, y, width) {
        if (item && DataManager.isSkill(item) && this._actor && item.meta) {
            var maxUse = Number(item.meta.MaxUse);
            var displayName = item.name;
            if (maxUse) {
                if (!this._actor._skillUses) this._actor.initSkillUses();
                var currentUse = this._actor._skillUses[item.id];
                if (currentUse === undefined) currentUse = maxUse;
                displayName += ' (' + currentUse + '/' + maxUse + ')';
            }
            
            var originalName = item.name;
            item.name = displayName;
            _Window_SkillList_drawItemName.call(this, item, x, y, width);
            item.name = originalName;
        } else {
            _Window_SkillList_drawItemName.call(this, item, x, y, width);
        }
    };

})();