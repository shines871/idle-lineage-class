    const MOB_DROPS = {
        // ===== 🏴‍☠️ 海賊島 =====
        '狂野之毒': [['arm_bluepirate_boots',0.5],['acc_curse_green',0.1],['new_item_157',1],['new_item_179',10]],
        '狂暴蜥蜴人': [['wpn_pirate_shortblade',1],['arm_bluepirate_cloak',0.8],['acc_curse_red',0.1],['new_item_154',1],['bk_dragon_awaken_falion',0.3],['acc_curse_diamond_ring',0.1],['acc_curse_emerald_ring',0.1]],
        '狂野毒牙': [['arm_bluepirate_boots',0.5],['acc_curse_green',0.1],['new_item_154',1],['new_item_179',10]],
        '狂野之魔': [['arm_bluepirate_boots',0.5],['acc_curse_green',0.1],['new_item_151',1],['new_item_179',10]],
        '高等蜥蜴人': [['arm_bluepirate_cloak',0.8],['acc_curse_red',0.1],['new_item_160',1],['bk_elf_mirror',0.1],['item_son_remains',3],['acc_curse_diamond_ring',0.1],['acc_curse_sapphire_ring',0.1]],
        '藍尾蜥蜴': [['arm_bluepirate_gloves',0.5],['acc_curse_green',0.1],['new_item_160',1],['item_son_letter',3]],
        '奇異鸚鵡': [['arm_bluepirate_gloves',0.5],['acc_curse_green',0.1],['new_item_154',1]],
        '藏寶箱': [['arm_bluepirate_armor',1]],
        '海賊骷髏': [['wpn_pirate_cutlass',1],['arm_46',0.01],['acc_curse_red',0.1],['acc_curse_blue',0.1],['new_item_154',1],['new_item_155',0.2],['acc_curse_diamond_ring',0.1],['acc_curse_emerald_ring',0.1]],
        '重裝蜥蜴人': [['wpn_pirate_shortblade',1],['arm_bluepirate_cloak',0.8],['acc_curse_red',0.1],['new_item_151',1],['acc_curse_diamond_ring',0.1],['acc_curse_ruby_ring',0.1],['acc_curse_sapphire_ring',0.1]],
        '海賊骷髏士兵': [['wpn_pirate_cutlass',1],['acc_curse_blue',0.1],['new_item_160',1],['new_item_161',0.1],['acc_curse_diamond_ring',0.1],['acc_curse_emerald_ring',0.1]],
        '海賊骷髏刀手': [['wpn_pirate_dagger',1],['acc_curse_blue',0.1],['scroll_weapon',0.25]],
        '海賊骷髏首領': [['wpn_pirate_cutlass',1],['acc_curse_blue',0.1],['new_item_151',1],['new_item_152',0.1],['acc_curse_diamond_ring',0.1],['acc_curse_ruby_ring',0.1],['item_son_portrait',2]],
        '德雷克': [['wpn_glory_sword',0.1],['wpn_pirate_shortblade',5],['wpn_pirate_cutlass',3],['wpn_abyss_dualblade',0.05],['wpn_dark_crystalball',0.05],['wpn_silent_crossbow',0.1],['arm_faith_shield',0.1],['new_item_151',5],['new_item_157',5],['new_item_154',5],['new_item_160',5],['new_item_152',1],['new_item_158',2],['new_item_161',1],['new_item_155',1],['new_item_153',1],['new_item_159',2],['new_item_162',1],['new_item_156',1],['bk_magic_shield',1],['bk_holy_barrier',0.1],['bk_soul_up',1],['bk_elf_attrfire',1],['bk_dragon_reaper',1],['acc_curse_diamond_ring',1],['acc_curse_ruby_ring',0.1],['acc_curse_sapphire_ring',1],['acc_curse_emerald_ring',1]],
        // ===== 🏛️ 底比斯 =====
        '底比斯 曼陀羅草(白)': [['mat_osiris_basic_up',5],['mat_rift_shard',10],['bk_dragon_awaken_falion',0.5]],
        '底比斯 曼陀羅草': [['mat_osiris_basic_down',5],['mat_rift_shard',10],['bk_dragon_awaken_falion',0.5]],
        '底比斯 聖甲蟲': [['mat_osiris_basic_up',5],['mat_rift_shard',10]],
        '底比斯 聖甲蟲(藍)': [['mat_osiris_basic_down',5],['mat_rift_shard',10]],
        '底比斯 凱比斯(黑)': [['mat_osiris_basic_up',5],['mat_rift_shard',10],['bk_dragon_awaken_antares',0.5]],
        '底比斯 凱比斯(紅)': [['mat_osiris_basic_down',5],['mat_rift_shard',10],['bk_dragon_awaken_antares',0.5]],
        '底比斯 尖碑石奴': [['mat_osiris_basic_up',5],['mat_rift_shard',10],['mem_cube_quake',0.5]],
        '底比斯 尖碑石奴(黑)': [['mat_osiris_basic_down',5],['mat_rift_shard',10],['mem_cube_quake',0.5]],
        '底比斯 斯芬克斯': [['mat_osiris_basic_up',5],['mat_rift_shard',10],['bk_dragon_lavabolt',0.05]],
        '底比斯 斯芬克斯(黑)': [['mat_osiris_basic_down',5],['mat_rift_shard',10],['bk_dragon_lavabolt',0.05]],
        '底比斯 尼荷斯': [['mat_osiris_high_up',5],['mat_rift_shard',10],['item_thebes_altar_key',2]],
        '底比斯 尼荷斯(藍)': [['mat_osiris_high_down',5],['mat_rift_shard',10],['item_thebes_altar_key',2]],
        '底比斯 阿努斯': [['mat_osiris_high_up',5],['mat_rift_shard',10],['item_thebes_altar_key',2]],
        '底比斯 阿努斯(黑)': [['mat_osiris_high_down',5],['mat_rift_shard',10],['item_thebes_altar_key',2]],
        '底比斯 巴斯': [['mat_osiris_high_up',5],['mat_rift_shard',10],['item_thebes_altar_key',2],['bk_dragon_deathlightning',0.3]],
        '底比斯 巴斯(紅)': [['mat_osiris_high_down',5],['mat_rift_shard',10],['item_thebes_altar_key',2],['bk_dragon_deathlightning',0.3]],
        '底比斯 阿努比斯': [['amu_cha',0.5],['acc_120',0.5],['amu_str',0.5],['amu_int',0.5],['acc_122',0.5],['acc_121',0.75],['acc_117',1.5],['acc_summon_ctrl',1.5],['acc_116',1.5],['acc_thebes_anubis',0.1],['blt_thebes_osiris',0.1],['scroll_armor',100],['scroll_weapon',100],['mat_crack_core',100],['item_osiris_box_high',100],['mem_mindbreak',0.5]],
        '底比斯 賀洛斯': [['amu_cha',0.5],['acc_120',0.5],['amu_str',0.5],['amu_int',0.5],['acc_122',0.5],['acc_121',0.75],['acc_117',1.5],['acc_summon_ctrl',1.5],['acc_116',1.5],['acc_thebes_horus',0.1],['blt_thebes_osiris',0.1],['scroll_armor',100],['scroll_weapon',100],['mat_crack_core',100],['item_osiris_box_high',100],['mem_mindbreak',0.5]],
        '林德拜爾': [['arm_83',1],['acc_117',3],['acc_116',3],['new_item_160',50],['new_item_161',50],['new_item_162',50],['bk_break',30],['bk_slow',30],['bk_charm',30],['bk_str_up',30],['bk_earthquake',30],['bk_regen',30],['bk_summon',10],['bk_holy_dash',10],['bk_tornado',10],['bk_blizzard',10],['bk_invisible',3],['bk_resurrection',30],['bk_holy_barrier',10],['bk_elf_windshot',10],['bk_elf_winddash',10],['bk_elf_stormeye',10],['bk_elf_stormshot',10],['bk_dark_crit',10],['new_item_193',100],['bk_dark_armorbreak',1],['scroll_acc',100],['wpn_katana',30],['wpn_siruge',30],['wpn_dual_silver',3],['wpn_dual_abyss',30],['wpn_crimson_spear',3],['wpn_claw_silver',3],['wpn_claw_abyss',3],['wpn_32',3],['wpn_xbow_abyss',10],['clk_pride_wind',10],['arm_88',3],['arm_59',30],['amr_plate',30],['glv_glove',30],['acc_122',10],['acc_121',10],['rng_wind',10],['acc_127',10],['acc_129',10],['acc_128',10],['acc_131',10],['acc_130',10]],
        '冰魔': [['wpn_33',5], ['wpn_crystal_dagger',0.5], ['wpn_vengeance',0.05], ['wpn_katana',1], ['wpn_2hsword',1], ['wpn_demon_scythe',0.05], ['wpn_hate_claw',0.05], ['hlm_demon',0.1], ['amr_demon',0.1], ['arm_59',1], ['amr_plate',1], ['glv_water_spirit',1], ['bot_demon',0.1], ['new_item_152',30], ['new_item_159',30], ['bk_shock_stun',5], ['bk_thunder_storm',5], ['bk_fire_storm',2], ['bk_meteor',0.2]],
        '巨人': [['wpn_alien',2.5], ['wpn_10',2.5], ['wpn_battleaxe',2], ['wpn_berserker',0.5], ['arm_110',0.01], ['acc_127',0.1], ['acc_129',0.1], ['acc_128',0.1], ['blt_body',0.01], ['acc_131',0.01], ['acc_130',0.01], ['blt_titan',0.001], ['bk_elf_physboost',0.2], ['wpn_thor_hammer',0.001]],
        '巨人戰士': [['wpn_alien',2.5], ['wpn_10',2.5], ['wpn_battleaxe',2], ['wpn_berserker',0.5], ['arm_110',0.01], ['acc_127',0.1], ['acc_129',0.1], ['acc_128',0.1], ['blt_body',0.01], ['acc_131',0.01], ['acc_130',0.01], ['blt_titan',0.001], ['bk_elf_physboost',0.2], ['wpn_thor_hammer',0.001]],
        '巨人長老': [['wpn_alien',2.5], ['wpn_10',2.5], ['wpn_battleaxe',3], ['wpn_berserker',0.5], ['arm_110',0.03], ['acc_127',0.1], ['acc_129',0.1], ['acc_128',0.1], ['blt_body',0.01], ['acc_131',0.01], ['acc_130',0.01], ['blt_titan',0.001], ['bk_elf_physboost',0.2], ['wpn_thor_hammer',0.001]],
        '古代巨人': [['wpn_katana',30], ['wpn_greatsword',10], ['mat_unknown_axe',0.03], ['amr_plate',30], ['glv_glove',30], ['acc_122',1], ['acc_129',1], ['blt_giant_ring',1], ['acc_131',1], ['blt_titan',0.1], ['new_item_151',30], ['new_item_152',30], ['new_item_153',1], ['scroll_weapon',10], ['scroll_armor',100], ['bk_reduction_armor',0.5], ['bk_spike_armor',1], ['bk_magic_shield',5], ['bk_meditation',5], ['bk_mana_drain',5], ['bk_greater_haste',5], ['bk_seal',0.5], ['bk_elf_earthguard',5], ['bk_elf_groundtrap',1], ['bk_elf_earthbless',5], ['bk_elf_steelguard',0.5], ['bk_elf_attrfire',0.1], ['scroll_attr_earth', 0.8]],
        // ===== 🔥 50級試煉擴充：精靈墓穴 =====
        '地之牙': [['wpn_mithril_dagger',0.1],['wpn_ori_dagger',0.05],['glv_earth_spirit',0.01],['new_item_151',1],['new_item_157',1],['new_item_160',1],['new_item_154',1],['new_item_152',0.3],['new_item_158',0.5],['new_item_161',0.1],['new_item_155',0.5],['bk_elf_earthshield',0.1],['bk_elf_physboost',0.2]],
        '風之牙': [['wpn_mithril_dagger',0.1],['wpn_ori_dagger',0.05],['glv_wind_spirit',0.01],['new_item_151',1],['new_item_157',1],['new_item_160',1],['new_item_154',1],['new_item_152',0.3],['new_item_158',0.5],['new_item_161',0.1],['new_item_155',0.5],['bk_elf_triple',0.05]],
        '水之牙': [['wpn_mithril_dagger',0.1],['wpn_ori_dagger',0.05],['glv_water_spirit',0.01],['new_item_151',1],['new_item_157',1],['new_item_160',1],['new_item_154',1],['new_item_152',0.3],['new_item_158',0.5],['new_item_161',0.1],['new_item_155',0.5],['bk_sleep_mist',0.2],['bk_elf_mirror',0.1],['bk_elf_watervital',0.1]],
        '火之牙': [['wpn_mithril_dagger',0.1],['wpn_ori_dagger',0.05],['glv_fire_spirit',0.005],['new_item_151',1],['new_item_157',1],['new_item_160',1],['new_item_154',1],['new_item_152',0.3],['new_item_158',0.5],['new_item_161',0.1],['new_item_155',0.5],['bk_fire_storm',0.1],['bk_elf_triple',0.05],['bk_elf_attrfire',0.01]],
        '水靈之主': [['scroll_acc',0.001],['wpn_mithril_dagger',0.5],['wpn_ori_dagger',0.1],['glv_water_spirit',0.05],['new_item_152',0.5],['new_item_158',0.8],['new_item_161',0.5],['new_item_155',0.8],['bk_sleep_mist',0.2],['bk_elf_watervital',0.1], ['scroll_attr_water', 0.07]],
        '深淵食屍鬼': [['wpn_crimson_spear',0.01],['wpn_demon_axe',0.1],['acc_abyss_ring',0.1],['scroll_armor',3],['bk_sleep_mist',0.2]],
        '深淵弓箭手': [['acc_abyss_ring',0.1],['bk_sleep_mist',0.2],['bk_elf_triple',0.05]],
        '地靈之主': [['wpn_mithril_dagger',0.5],['wpn_ori_dagger',0.1],['glv_earth_spirit',0.03],['new_item_152',0.5],['new_item_158',0.8],['new_item_161',0.5],['new_item_155',0.8],['bk_elf_earthshield',0.1],['bk_elf_physboost',0.5], ['scroll_attr_earth', 0.07]],
        '風靈之主': [['wpn_mithril_dagger',0.5],['wpn_ori_dagger',0.1],['glv_wind_spirit',0.02],['new_item_152',0.5],['new_item_158',0.8],['new_item_161',0.5],['new_item_155',0.8], ['scroll_attr_wind', 0.07]],
        '火靈之主': [['wpn_mithril_dagger',0.5],['wpn_ori_dagger',0.1],['glv_fire_spirit',0.01],['new_item_152',0.5],['new_item_158',0.8],['new_item_161',0.5],['new_item_155',0.8],['bk_fire_storm',0.1],['bk_elf_attrfire',0.02], ['scroll_attr_fire', 0.08]],
        '西斯': [['scroll_acc',0.001],['acc_abyss_ring',0.1],['bk_sleep_mist',0.2],['bk_elf_magicerase',0.01], ['mat_black_blood', 1]],
        '深淵水靈': [['wpn_mithril_dagger',1],['wpn_ori_dagger',0.2],['wpn_crimson_spear',0.01],['wpn_demon_axe',0.1],['glv_water_spirit',0.08],['new_item_152',1],['new_item_158',1],['new_item_161',1],['new_item_155',1],['bk_elf_mirror',0.2],['bk_elf_watervital',0.25], ['scroll_attr_water', 0.09]],
        '深淵地靈': [['wpn_mithril_dagger',1],['wpn_ori_dagger',0.2],['wpn_crimson_spear',0.01],['wpn_demon_axe',0.1],['glv_earth_spirit',0.05],['new_item_152',1],['new_item_158',1],['new_item_161',1],['new_item_155',1],['bk_elf_mirror',0.2],['bk_elf_physboost',1], ['scroll_attr_earth', 0.09]],
        '深淵風靈': [['wpn_mithril_dagger',1],['wpn_ori_dagger',0.2],['wpn_crimson_spear',0.01],['wpn_demon_axe',0.1],['glv_wind_spirit',0.05],['new_item_152',1],['new_item_158',1],['new_item_161',1],['new_item_155',1],['bk_elf_mirror',0.2], ['scroll_attr_wind', 0.09]],
        '深淵火靈': [['scroll_acc',0.001],['wpn_mithril_dagger',1],['wpn_ori_dagger',0.2],['wpn_crimson_spear',0.01],['wpn_demon_axe',0.1],['glv_fire_spirit',0.02],['new_item_152',1],['new_item_158',1],['new_item_161',1],['new_item_155',1],['bk_elf_mirror',0.2],['bk_elf_attrfire',0.03], ['scroll_attr_fire', 0.09]],
        '曼波兔': [['wpn_mithril_dagger',3],['wpn_ori_dagger',1],['hlm_mambo',0.1],['amr_mambo',0.1],['glv_water_spirit',0.1],['glv_earth_spirit',0.1],['glv_fire_spirit',0.1],['glv_wind_spirit',0.1],['new_item_152',10],['new_item_158',10],['new_item_161',3],['new_item_155',10],['new_item_153',1],['new_item_159',1],['new_item_162',1],['new_item_156',1],['bk_holy_dash',0.3],['bk_soul_up',0.1],['bk_elf_triple',0.1],['bk_elf_magicerase',0.02],['bk_elf_mirror',0.3],['bk_elf_physboost',0.2],['bk_elf_watervital',0.1],['bk_elf_attrfire',0.05],['acc_purify_earring',0.1]],
        '深淵之主': [['acc_124',1],['scroll_acc',0.1],['wpn_crimson_spear',0.3],['wpn_demon_axe',3],['acc_abyss_ring',2],['new_item_152',30],['new_item_158',30],['new_item_161',30],['new_item_155',30],['new_item_153',1],['new_item_159',5],['new_item_162',5],['new_item_156',3],['bk_shock_stun',0.05],['bk_seal',1],['bk_meteor',0.05], ['mat_black_blood', 15]],
        // ===== 🔥 50級試煉擴充：大洞穴隱遁者村莊地區 =====
        '魔蝙蝠': [['bk_tornado',0.01]],
        '黑暗妖精盜賊': [['scroll_acc',0.0001],['wpn_small_katana',2],['wpn_dual_rasta',1],['wpn_xbow_rasta',3],['arm_rasta_leather',0.5],['bot_rasta',1],['shd_rasta',5],['scroll_weapon',0.5],['scroll_armor',0.5],['bk_holy_dash',0.05],['bk_dark_poison',1],['bk_dark_str',1],['bk_dark_burn',1],['bk_dark_crit',0.5]],
        '闇之精靈': [['scroll_weapon',0.5],['scroll_armor',0.5],['bk_holy_barrier',0.003],['bk_abs_barrier',0.001],['bk_dark_stealth',1],['bk_dark_poison',1],['bk_dark_mrup',1],['bk_dark_burn',1],['bk_dark_poisonres',1],['bk_dark_double',0.1],['bk_dark_fang',0.1],['bk_dark_crit',0.5],['mat_rough_stone',5]],
        '犰狳': [['scroll_armor',0.5]],
        '魔熊': [['acc_bear_ring',0.001],['scroll_weapon',0.5],['scroll_armor',0.5],['bk_bless_wpn',0.1],['bk_slow',0.5]],
        '歐姆民兵': [['scroll_weapon',0.5],['bk_bless_wpn',0.1],['bk_slow',0.5]],
        '闇精靈王': [['scroll_weapon',0.5],['scroll_armor',0.5],['bk_bless_wpn',0.1],['bk_berserk',0.1],['bk_soul_up',0.001],['bk_abs_barrier',0.001],['bk_elf_blazewpn',0.05],['bk_dark_stealth',1],['bk_dark_poison',1],['bk_dark_mrup',1],['bk_dark_burn',1],['bk_dark_double',0.1],['bk_dark_fang',0.1],['bk_dark_crit',0.5],['mat_rough_stone',5],['wpn_qigu_resonance',0.001]],
        '金屬蜈蚣': [['amr_centipede',0.5], ['mat_black_blood', 2]],
        '馴獸師': [['item_tiger_feed',10], ['clk_wolf',0.5],['scroll_weapon',0.5],['scroll_armor',0.3],['bk_dark_poison',1],['bk_dark_mrup',1],['bk_dark_burn',1],['bk_dark_poisonres',1],['bk_dark_dex',1],['bk_dark_double',0.1]],
        // ===== 🔥 50級試煉擴充：古代巨人之墓 =====
        '墳墓守護者': [['scroll_acc',0.001],['new_item_151',5],['new_item_160',5],['new_item_154',10],['new_item_152',1],['new_item_161',1],['new_item_155',2],['new_item_153',0.5],['new_item_162',1],['new_item_156',1],['mat_demon_anklet_white',0.02]],
        '墳墓守護者法師': [['new_item_151',5],['new_item_160',5],['new_item_154',10],['new_item_152',1],['new_item_161',1],['new_item_155',2],['new_item_153',0.5],['mat_demon_anklet_blue',0.05]],
        '墳墓守護者騎士': [['new_item_151',5],['new_item_160',5],['new_item_154',10],['new_item_152',2],['new_item_161',2],['new_item_155',2],['new_item_153',0.5],['mat_demon_anklet_red',0.05]],
        '巨大墳墓守護者': [['scroll_acc',0.001],['new_item_151',5],['new_item_160',5],['new_item_154',5],['new_item_152',5],['new_item_161',1],['new_item_155',3],['new_item_153',0.5],['new_item_162',1],['new_item_156',1],['mat_demon_anklet_black',0.05]],
        // ===== 🔥 50級試煉擴充：魔族神殿 =====
        '炎魔的分身': [['new_item_157',10],['new_item_160',10],['new_item_154',10],['new_item_158',2],['new_item_161',2],['new_item_155',1],['new_item_159',5],['new_item_162',1],['new_item_156',1],['mat_black_mithril',0.5]],
        '黑暗棲林者': [['amr_darkdweller',0.8],['bot_darkdweller',0.8],['scroll_armor',0.5],['scroll_weapon',0.3],['quest_ring_darkdweller',0.05]],
        '炎魔的思克巴': [['mat_black_mithril',0.5], ['new_item_150',5]],
        '炎魔的思克巴女皇': [['acc_117',0.001],['acc_116',0.001],['mat_black_mithril',0.5], ['mat_black_blood', 1], ['new_item_150',5]],
        '炎魔的小惡魔': [['mat_black_mithril',0.5], ['mat_black_blood', 1]],
        '炎魔的巴風特': [['scroll_acc',0.001],['wpn_powerless_baphomet',0.0001],['amr_baphomet',0.001],['new_item_151',5],['new_item_154',5],['new_item_152',1],['new_item_161',1],['new_item_153',0.5],['mat_black_mithril',0.5], ['mat_black_blood', 1]],
        '墮落的司祭(一階)': [['mat_black_mithril',0.5],['mat_fallen_fang',0.01],['item_fallen_key',0.5],['mat_soulstone_shard',1],['new_item_234',1], ['mat_black_blood', 1.5]],   // ⚔️ 戰士試煉：神秘慎重藥水 1%
        '墮落的司祭(二階)': [['mat_black_mithril',0.5],['item_fallen_key',0.5],['mat_soulstone_shard',1],['new_item_234',1], ['mat_black_blood', 1.5]],   // ⚔️ 戰士試煉：神秘慎重藥水 1%
        '墮落的司祭(三階)': [['mat_black_mithril',0.5],['mat_fallen_hand',0.01],['item_fallen_key',0.5],['mat_soulstone_shard',1],['new_item_234',1], ['mat_black_blood', 1.5]],   // ⚔️ 戰士試煉：神秘慎重藥水 1%
        '炎魔的巴列斯': [['scroll_acc',0.001],['wpn_powerless_baless',0.0001],['bot_baless',0.001],['new_item_151',5],['new_item_154',5],['new_item_152',1],['new_item_161',1],['new_item_153',0.5],['mat_black_mithril',0.5], ['mat_black_blood', 1]],
        '墮落的司祭(四階)': [['mat_black_mithril',0.5],['mat_fallen_poison',0.01],['item_fallen_key',0.5],['mat_soulstone_shard',1], ['mat_black_blood', 1.5]],
        '墮落的司祭(五階)': [['mat_black_mithril',0.5],['mat_fallen_tongue',0.01],['item_fallen_key',0.5],['mat_soulstone_shard',1], ['mat_black_blood', 1.5]],
        '炎魔的惡魔': [['mat_flame_eye',3],['wpn_vengeance',0.01],['wpn_demon_scythe',0.0001],['wpn_hate_claw',0.001],['new_item_153',1],['mat_black_mithril',0.5],['mat_flame_sword',3],['mat_flame_claw',3],['mat_flame_heart',3]],
        '墮落': [['blt_mr',1],['scroll_acc',0.001],['clk_fallen',0.01],['amr_fallen',0.01],['glv_fallen',0.01],['bot_fallen',0.01],['mat_black_mithril',10],['mat_fallen_scythe',0.1],['mat_fallen_head',0.1],['mat_soulstone_shard',5], ['mat_black_blood', 5]],
        // 🌑 暗影神殿 掉落
        '死亡的司祭(思克巴)': [['mat_black_mithril',1],['mat_soulstone_shard',5]],
        '死亡的司祭(巴風特)': [['mat_black_mithril',1],['mat_soulstone_shard',5]],
        '混沌的司祭(飛翼)': [['mat_black_mithril',1],['mat_soulstone_shard',5]],
        '混沌的司祭(野獸)': [['scroll_acc',0.001],['mat_black_mithril',1],['mat_soulstone_shard',5]],
        '火焰之影親衛隊(巴風特)': [['scroll_acc',0.001],['mat_black_mithril',1],['mat_soulstone_shard',5]],
        '混沌': [['scroll_acc',0.1],['wpn_chaos_thorn',0.1],['hlm_chaos',2],['clk_chaos',0.1],['amr_chaos',2],['glv_chaos',0.5],['mat_chaos_head',20],['mat_black_mithril',30],['mat_soulstone_shard',100], ['mat_black_blood', 50]],
        '死亡': [['clk_death',0.1],['amr_death',0.1],['glv_death',0.1],['shd_death',0.1],['mat_death_head',10],['mat_black_mithril',30],['mat_soulstone_shard',100], ['mat_black_blood', 50]],
        // ===== 拉斯塔巴德地下洞穴 =====
        '歐姆': [['scroll_revive', 1]],
        '狂暴的歐姆': [['scroll_revive', 1]],
        '歐姆裝甲兵': [['scroll_acc',0.0001],['wpn_xbow_rasta', 0.2]],
        '狂暴的歐姆裝甲兵': [['wpn_xbow_rasta', 0.2], ['scroll_weapon', 0.5], ['scroll_armor', 1]],
        '黑暗妖精殘兵(弓)': [['wpn_small_katana', 0.1], ['wpn_bow_rasta', 0.5], ['arm_rasta_leather', 2], ['bot_rasta', 1], ['quest_ring_darkdweller', 0.1]],
        '黑暗妖精殘兵(劍)': [['wpn_sword_rasta', 0.5], ['clk_dark', 0.1], ['arm_rasta_leather', 3], ['bot_rasta', 2], ['scroll_weapon', 0.5], ['scroll_armor', 1], ['bk_berserk', 0.1], ['bk_dark_str', 1], ['bk_dark_burn', 0.5], ['bk_dark_erup', 0.1]],
        '黑暗妖精殘兵(十字弓)': [['wpn_dagger_rasta', 0.5], ['wpn_xbow_rasta', 1], ['scroll_weapon', 0.5], ['scroll_armor', 1], ['bk_holy_dash', 0.1], ['bk_dark_stealth', 1], ['bk_dark_poison', 1], ['bk_dark_str', 1], ['bk_dark_crit', 0.1], ['bk_dark_erup', 0.1], ['quest_ring_darkdweller', 0.1]],
        '黑暗妖精殘兵(法師)': [['wpn_wand_rasta', 0.5], ['amr_rasta_robe', 0.1], ['bk_dark_dex', 1]],
        '黑暗妖精殘兵(雙手劍)': [['wpn_dual_rasta', 0.5]],
        '黑暗精靈使': [['scroll_acc',0.001],['scroll_weapon', 0.5], ['scroll_armor', 1], ['bk_holy_barrier', 0.005], ['bk_dark_stealth', 1], ['bk_dark_poison', 1], ['bk_dark_mrup', 1], ['bk_dark_burn', 1], ['bk_dark_poisonres', 0.5], ['bk_dark_double', 0.05], ['bk_dark_fang', 0.1], ['bk_dark_crit', 0.5], ['quest_ring_elfcaller', 0.001], ['bk_abs_barrier', 0.01]],
        // ===== 拉斯塔巴德正門：黑暗妖精守軍 =====
        '黑暗妖精警衛(十字弓)': [['wpn_xbow_heavy_rasta', 0.5], ['scroll_armor', 0.5], ['scroll_weapon', 0.5], ['bk_holy_dash', 0.05], ['bk_dark_poison', 1], ['bk_dark_burn', 1], ['bk_dark_poisonres', 1]],
        '黑暗妖精魔法學徒': [['wpn_wand_rasta', 1], ['amr_rasta_robe', 0.1], ['bk_dark_dex', 1], ['mat_black_blood', 1]],
        '黑暗妖精警衛(矛)': [['wpn_spear_rasta', 0.5], ['arm_rasta_leather', 0.5], ['shd_rasta', 1], ['scroll_armor', 0.5], ['scroll_weapon', 0.5], ['bk_dark_mrup', 1], ['bk_dark_burn', 1], ['bk_dark_fang', 0.1]],
        '黑暗妖精巡守': [['wpn_small_katana', 1], ['wpn_bow_rasta', 2], ['arm_rasta_leather', 0.5], ['bot_rasta', 1], ['mat_steel_chunk',5]],
        '黑暗妖精士兵': [['wpn_sword_rasta', 1], ['arm_rasta_leather', 0.5], ['bot_rasta', 1], ['scroll_armor', 0.5], ['scroll_weapon', 0.5], ['bk_dark_poison', 1], ['bk_dark_burn', 1], ['bk_dark_str', 1]],
        '黑暗妖精將軍': [['scroll_acc',0.001],['scroll_armor', 0.5], ['scroll_weapon', 0.5], ['bk_reduction_armor', 0.05], ['bk_meteor', 0.001], ['bk_dark_poison', 1], ['bk_dark_burn', 1], ['bk_dark_poisonres', 1], ['bk_dark_dex', 0.6], ['bk_dark_double', 0.1], ['bk_dark_fang', 0.5], ['mat_black_blood', 1], ['mat_steel_chunk',10], ['relic_general_swordguard',0.0001]],
        // ===== 魔獸訓練場 =====
        '拉斯塔巴德守門人': [['item_king_key', 1]],
        '黑虎': [['quest_ring_beasttamer', 0.05], ['mat_legion_beast', 0.05], ['clk_blacktiger', 0.5]],
        '拉斯塔巴德馴獸師': [['item_tiger_feed',10], ['wpn_official_2h', 0.01], ['glv_official', 0.05], ['bot_official', 0.05], ['quest_ring_beasttamer', 0.05], ['mat_legion_beast', 0.05]],
        '受詛咒的馴獸師': [['wpn_official_2h', 0.01], ['glv_official', 0.05], ['bot_official', 0.05], ['quest_ring_beasttamer', 0.05], ['mat_legion_beast', 0.05]],
        '地獄束縛犬': [['quest_ring_beasttamer', 0.05], ['mat_legion_beast', 0.05]],
        '魂騎士': [['scroll_acc',0.001],['wpn_official_2h', 0.01], ['glv_official', 0.05], ['bot_official', 0.05], ['blt_dark', 0.05], ['quest_ring_beasttamer', 0.05], ['mat_legion_beast', 0.05]],
        '地獄奴隸': [['scroll_acc',0.0001],['mat_legion_beast', 0.05],['shd_official',0.03],['blt_dark',0.1],['mat_holy_relic',0.5],['mat_summonorb_core',0.1],['mat_summonorb_shard',1]],   // 🌑 v3.3.33 聖地追加（同名鍵合併·記憶水晶(幻覺：化身)0.25% 在 MEM_DROPS）
        // ===== 🌑 黑暗妖精聖地（依《黑暗妖精聖地.md》·v3.3.33）＝掉落鍵以怪名比對 =====
        '受詛咒的黑暗妖精鬥士': [['mat_holy_relic',0.5],['mat_de_soul_crystal',1],['ear_cursed_black',0.05],['mat_summonorb_core',0.1],['mat_summonorb_shard',1]],
        '受詛咒的黑暗妖精法師': [['mat_holy_relic',0.5],['mat_de_soul_crystal',1],['ear_cursed_black',0.05],['mat_summonorb_core',0.1],['mat_summonorb_shard',1]],
        '受詛咒的黑暗妖精騎士': [['mat_holy_relic',0.5],['mat_de_soul_crystal',1],['ear_cursed_black',0.05],['mat_summonorb_core',0.1],['mat_summonorb_shard',1]],
        '食腐獸': [['mat_holy_relic',0.5],['mat_summonorb_core',0.1],['mat_summonorb_shard',1],['bk_elf_preciseshot',0.001]],   // 記憶水晶(立方：地裂)0.5% 在 MEM_DROPS
        '特提斯': [['mat_holy_relic',0.5],['mat_summonorb_core',0.1],['mat_summonorb_shard',1]],
        '翼龍': [['mat_holy_relic',0.5],['mat_summonorb_core',0.1],['mat_summonorb_shard',1],['bk_greater_haste',1],['bk_elf_preciseshot',0.001]],
        '吉爾塔斯': [['item_giltas_seal',100],['scroll_weapon',100],['scroll_armor',100],['wpn_xbow_abyss',3],['wpn_claw_abyss',3],['wpn_dual_abyss',3],['acc_133',1],['acc_135',1],['acc_136',1],['acc_137',1],['blt_titan',1],['arm_45',5],['arm_46',5],['arm_47',5],['hlm_mr',30],['amu_str',10],['acc_120',10],['acc_121',10],['amu_int',10],['acc_122',10],['amu_cha',10],['acc_summon_ctrl',3],['acc_117',3],['acc_116',3],['acc_demonbane',10],['rng_fire',10],['bk_shock_stun',15],['bk_elf_earthshield',15],['bk_elf_watervital',15],['bk_elf_lifebless',15],['bk_elf_groundtrap',15],['bk_elf_seal',15],['bk_elf_winddash',15],['bk_elf_soul',15],['bk_elf_release',15],['bk_mummy_curse',15],['bk_fire_storm',5],['bk_full_heal',5],['bk_blizzard',5],['bk_disintegrate',1],['bk_resurrection',1],['bk_meteor',1],['bk_holy_dash',15],['bk_abs_barrier',5],['bk_holy_barrier',5],['bk_thunder_storm',5],['bk_invisible',5],['bk_seal',5],['bk_soul_up',5],['bk_royal_burnweapon',15],['bk_reduction_armor',15],['bk_spike_armor',5],['wpn_official_2h',5],['wpn_official_blade',5],['amr_official',5],['hlm_official',5],['arm_official_cloak',5],['glv_official',5],['bot_official',5],['shd_official',5],['wpn_priest_wand',5],['amr_priest',5],['hlm_priest',5],['clk_priest',5],['glv_priest',5],['bot_priest',5],['shd_priest_book',5],['wpn_giltas_sword',0.1],['wpn_giltas_wand',0.1],['amu_pain',10],['amu_doom',10],['bk_counter_barrier',5],['bk_elf_flamesoul',1],['bk_elf_energyboost',5],['bk_dragon_awaken_baraka',5],['wpn_rotten_longbow',0.1],['shd_rebel',0.1],['rng_sage',1]],
        '真‧死亡騎士 冥皇丹特斯': [['wpn_cursed_emperor_blade',5],['wpn_emperor_blade',1],['clk_emperor',1],['amr_emperor',1],['hlm_emperor',1],['glv_emperor',1],['bot_emperor',1],['scroll_weapon',100],['scroll_armor',100]],   // 🌑 v3.4.0 +受詛咒的真．冥皇執行劍 5%（黑暗妖精聖地(2).md）
        '喚獸師': [['item_tiger_feed',10], ['amr_summoner_robe', 0.01], ['acc_summoner_amulet', 0.001], ['quest_ring_summoner', 0.01]],
        // ===== 魔獸軍王之室 BOSS =====
        '魔獸軍王巴蘭卡': [['scroll_acc',0.1],['wpn_baranka_claw', 1], ['wpn_baranka_steelclaw', 0.1], ['hlm_official', 2], ['hlm_baranka', 0.1], ['amr_official', 2], ['amr_baranka', 0.1], ['glv_official', 3], ['glv_baranka', 1], ['bot_kingbeast', 0.1], ['bot_official', 3], ['bot_baranka', 0.1], ['blt_dark', 5], ['mat_legion_beast', 100], ['mat_crest_beast', 10]],
        '法令軍王蕾雅': [['scroll_acc',0.1],['wpn_laia_wand', 0.03], ['wpn_priest_wand', 3], ['hlm_priest', 3], ['amr_laia_robe', 0.1], ['amr_kinglaw', 0.1], ['amr_priest', 3], ['glv_priest', 3], ['bot_priest', 3], ['acc_laia_amulet', 0.1], ['acc_law_king_chain', 0.1], ['acc_laia_ring', 0.05], ['blt_dark', 1], ['mat_legion_law', 100], ['mat_crest_law', 10]],
        '冥法軍王海露拜': [['scroll_acc',0.1],['wpn_priest_wand', 3], ['hlm_priest', 3], ['clk_kingnecro', 0.05], ['shd_priest_book', 3], ['acc_necro_king_ring', 0.1], ['mat_legion_necro', 100], ['mat_crest_necro', 10], ['bk_elf_flamesoul', 0.02]],
        '暗殺軍王史雷佛': [['scroll_acc',0.1],['wpn_assassin_mark', 0.1], ['hlm_official', 3], ['glv_official', 3], ['glv_kingassassin', 0.1], ['bot_official', 3], ['blt_dark', 10], ['mat_legion_assassin', 100], ['mat_crest_assassin', 10]],
        // ===== 黑魔法研究室 =====
        '地元素守護者': [['mat_legion_law', 0.05], ['mat_earth_breath', 0.1]],
        '水元素守護者': [['mat_legion_law', 0.05], ['mat_water_breath', 0.1]],
        '風元素守護者': [['mat_legion_law', 0.05], ['mat_wind_breath', 0.1]],
        '火元素守護者': [['mat_legion_law', 0.05], ['mat_fire_breath', 0.1]],
        '黑暗妖精法師': [['mat_legion_law', 0.05], ['wpn_wand_rasta', 1], ['amr_rasta_robe', 0.1], ['bk_dark_dex', 1], ['bk_tornado', 0.05], ['bk_ice_spike', 1], ['bk_soul_up', 0.01], ['mat_steel_chunk',5]],
        '黑法師': [['scroll_acc',0.0001],['wpn_darkmage_wand', 0.01], ['amr_darkmage_robe', 0.05], ['acc_darkmage_amulet', 0.001], ['quest_ring_darkmage', 0.01]],
        // ===== 冥法軍訓練場 =====
        '黑暗復仇者': [['wpn_dark_sword', 0.01], ['amr_official', 0.05], ['mat_legion_necro', 0.1], ['arm_59', 0.1]],
        // ===== 🏛️ 格蘭肯神殿．長老之室 掉落（3 一般怪 + 8 長老 BOSS·各含 死亡騎士之書1%＋修行者經典1%） =====
        '拉斯塔巴德近衛隊': [['wpn_spear_rasta', 0.1]],
        '拉斯塔巴德近衛隊隊長': [['wpn_dual_spike', 0.5]],
        '長老隨從': [['clk_priest', 0.5], ['shd_priest_book', 0.1]],
        '長老．琪娜': [['bk_zombie', 3], ['mat_black_powder', 3], ['mat_history_1', 3], ['item_dk_insignia', 3], ['item_dk_book', 1], ['mat_ascetic_classic', 1]],
        '長老．安迪斯': [['wpn_official_blade', 0.5], ['wpn_dark_sword', 0.5], ['wpn_xbow_dark', 0.5], ['hlm_dark', 0.5], ['glv_official', 0.5], ['bk_shock_stun', 1], ['bk_blizzard', 1], ['bk_holy_barrier', 0.1], ['bk_soul_up', 0.8], ['bk_dark_fang', 1], ['mat_black_powder', 3], ['mat_history_4', 3], ['item_dk_insignia', 3], ['bk_elf_energyboost', 1], ['item_dk_book', 1], ['mat_ascetic_classic', 1]],
        '長老．巴塔斯': [['wpn_dual_spike', 0.5], ['wpn_dual_dark', 0.5], ['wpn_dual_rasta', 0.5], ['bot_official', 0.5], ['bk_seal', 1], ['bk_elf_soul', 0.5], ['mat_black_powder', 3], ['mat_history_2', 3], ['item_dk_insignia', 3], ['item_dk_book', 1], ['mat_ascetic_classic', 1]],
        '長老．巴洛斯': [['wpn_red_crystalwand', 0.1], ['hlm_priest', 0.5], ['clk_priest', 0.5], ['bk_mummy_curse', 1], ['bk_cancel', 1], ['bk_slow', 1], ['bk_elf_earthshield', 1], ['bk_elf_watervital', 1], ['bk_elf_energyboost', 1], ['mat_black_powder', 3], ['mat_history_3', 3], ['item_dk_insignia', 3], ['item_dk_book', 1], ['mat_ascetic_classic', 1]],
        '長老．巴陸德': [['wpn_crystal_dagger', 0.5], ['wpn_red_crystalwand', 0.1], ['wpn_priest_wand', 0.5], ['amr_dark_cape', 0.5], ['bk_spike_armor', 0.5], ['bk_thunder_storm', 0.5], ['bk_meteor', 0.5], ['bk_abs_barrier', 0.1], ['bk_elf_winddash', 1], ['bk_elf_flamesoul', 1], ['bk_elf_energyboost', 1], ['bk_dragon_awaken_baraka', 0.5], ['mat_black_powder', 3], ['mat_history_8', 3], ['item_dk_insignia', 3], ['item_dk_book', 1], ['mat_ascetic_classic', 1]],
        '長老．拉曼斯': [['wpn_dark_sword', 0.5], ['wpn_official_2h', 0.5], ['wpn_claw_dark', 0.5], ['hlm_official', 0.5], ['arm_official_cloak', 0.5], ['bot_dark', 0.5], ['bk_invisible', 0.2], ['bk_elf_groundtrap', 1], ['bk_dark_str', 1], ['bk_elf_energyboost', 1], ['mat_black_powder', 3], ['mat_history_7', 3], ['item_dk_insignia', 3], ['item_dk_book', 1], ['mat_ascetic_classic', 1]],
        '長老．泰瑪斯': [['wpn_blood_2hsword', 1], ['clk_dark', 0.5], ['glv_official', 0.5], ['bk_holy_dash', 0.5], ['bk_elf_mirror', 1], ['bk_dark_dex', 1], ['bk_elf_energyboost', 1], ['mat_black_powder', 3], ['mat_history_6', 3], ['item_dk_insignia', 3], ['item_dk_book', 1], ['mat_ascetic_classic', 1]],
        '長老．艾迪爾': [['glv_dark', 1], ['bot_priest', 0.5], ['bk_dark_shadow', 0.5], ['bk_sleep_mist', 0.5], ['bk_elf_lifebless', 0.5], ['bk_dragon_awaken_antares', 1], ['mat_black_powder', 3], ['mat_history_5', 3], ['item_dk_insignia', 3], ['item_dk_book', 1], ['mat_ascetic_classic', 1]],
        '血色術士': [['wpn_red_crystalwand', 0.1], ['hlm_priest', 0.05], ['amr_priest', 0.05], ['amr_dark_cape', 1], ['bot_priest', 0.05], ['mat_legion_necro', 0.1]],
        '歐姆戰士': [['hlm_priest', 0.05], ['clk_priest', 0.02], ['bot_priest', 0.05], ['glv_priest', 0.05], ['blt_dark', 0.05], ['mat_legion_assassin', 0.1], ['mat_legion_necro', 0.1]],
        '闇黑君王': [['wpn_red_crystalwand', 0.1], ['hlm_priest', 0.02], ['bot_priest', 0.02], ['mat_legion_necro', 0.1]],
        '血騎士': [['wpn_blood_2hsword', 0.1], ['hlm_priest', 0.05], ['mat_legion_necro', 0.1]],
        '重裝歐姆戰士': [['hlm_priest', 0.05], ['clk_priest', 0.02], ['bot_priest', 0.05], ['blt_dark', 0.05], ['mat_legion_assassin', 0.1]],
        '冰之女王侍女': [['bk_thunder_storm', 0.05], ['bk_cancel', 0.1]],
        '冰之女王': [['mat_icequeen_heart',1],['wpn_crystal_dagger', 0.5], ['arm_88', 0.1], ['arm_63', 10], ['glv_crystal', 5], ['acc_116', 0.1], ['amu_int', 1], ['acc_122', 1], ['acc_128', 0.5], ['acc_129', 0.5], ['acc_130', 0.1], ['acc_131', 0.1], ['scroll_weapon', 10], ['scroll_armor', 20], ['scroll_revive', 1], ['new_item_150', 1], ['new_item_151', 50], ['new_item_152', 5], ['bk_summon', 0.5], ['bk_invisible', 0.05], ['bk_fire_storm', 0.5], ['new_item_195', 1], ['bk_elf_winddash', 1], ['bk_elf_lifespring', 3], ['bk_elf_lifebless', 1], ['bk_elf_steelguard', 1], ['bk_magic_shield', 2], ['bk_dark_shadow', 1], ['bk_seal', 1], ['wpn_icequeen_wand', 0.1], ['bk_blizzard_storm', 1], ['bk_elf_watervital', 10], ['hlm_icequeen_charm', 0.3], ['amr_icequeen_charm', 0.3], ['bot_icequeen_charm', 0.3], ['mat_ice_crystal', 1], ['acc_icequeen_ear_0', 1], ['scroll_attr_water', 3], ['wpn_mana_orb',0.1]],   // 🆕 瑪那水晶球 0.1%
        '夢幻之島蘑菇': [['scroll_weapon',1], ['scroll_armor',2]],
        '夢幻之島鬼火': [['scroll_weapon',1], ['scroll_armor',2], ['scroll_poly',1], ['arm_bluepirate_cloak',0.1]],   // 🆕 藍海賊斗篷 0.1%
        '夢幻之島火蜥蜴': [['wpn_2hsword',1], ['wpn_giantaxe',1], ['scroll_weapon',1], ['scroll_armor',2], ['bk_fire_storm',0.01]],
        '夢幻之島冰人': [['scroll_weapon',1], ['scroll_armor',2]],
        '夢幻之島殺人蜂': [['scroll_weapon',1], ['scroll_armor',2]],
        '夢幻之島暴走兔': [['item_carrot',10], ['scroll_weapon',1], ['scroll_armor',2]],
        '夢幻之島火炎蛋': [['scroll_weapon',1], ['scroll_armor',2], ['bk_holy_light',0.5], ['scroll_poly',1]],
        '夢幻之島冰石高崙': [['wpn_silveraxe',1], ['scroll_weapon',1], ['scroll_armor',2], ['scroll_revive',1], ['bk_elf_soul',0.1], ['new_item_150',5]],
        '夢幻之島大鬼火': [['scroll_weapon',1], ['scroll_armor',2]],
        '夢魘': [['wpn_2hsword',3], ['scroll_weapon',5], ['scroll_armor',10], ['panacea_wis',1], ['bk_elf_triple',0.1]],
        '冰人': [['wpn_battleaxe',1], ['new_item_150',1], ['new_item_195',1], ['bk_elf_watervital',0.1]],
        '不死鳥': [['arm_69', 10], ['wpn_katana',5], ['wpn_siruge',1], ['amr_plate',5], ['arm_88',0.1], ['arm_63',10], ['acc_117',0.01], ['amu_str',0.1], ['acc_120',0.1], ['acc_128',1], ['acc_129',1], ['acc_130',0.5], ['acc_131',0.5], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_159',0.1], ['bk_sleep_mist',1], ['bk_holy_barrier',0.1], ['bk_meteor',0.05], ['bk_fire_storm',0.5], ['bk_elf_dancefire',1], ['bk_blaze',1], ['bk_elf_flamesoul',0.1], ['bk_fire_prison',1], ['bk_elf_attrfire',1], ['scroll_attr_fire', 2.25], ['wpn_redflame_sword',0.1], ['wpn_redflame_bow',0.1]],   // 🆕 赤焰之劍/弓 各0.1%
        '亞力安': [['scroll_weapon',1], ['scroll_armor',2], ['scroll_acc',0.01], ['bk_slow',0.5], ['bk_mummy_curse',0.5], ['bk_heal2',0.1], ['bk_holy_light',0.1], ['bk_haste_spell',0.5], ['bk_earthquake',0.1], ['bk_rock_prison',0.5], ['bk_greater_haste',0.1], ['bk_quake',0.005], ['bk_elf_groundtrap',0.1], ['acc_demonbane',0.01], ['mat_steel_chunk',5]],
        '人形殭屍': [['bk_vampire',0.01], ['bk_dark_shadow',0.1]],
        '人魚': [['scroll_acc',0.01], ['new_item_mermaid_scale', 1], ['bk_blizzard_storm', 0.001]],
        '伊弗利特': [['arm_69', 10], ['wpn_katana',2], ['amr_plate',5], ['arm_63',10], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_152',0.5], ['new_item_153',0.1], ['new_item_155',0.5], ['new_item_156',0.1], ['new_item_158',0.5], ['new_item_159',0.1], ['new_item_161',0.5], ['new_item_162',0.1], ['bk_fireball',3], ['bk_dex_up',1], ['bk_str_up',1], ['bk_cancel',1], ['bk_fire_storm',0.2], ['bk_elf_magicerase',1], ['bk_elf_triple',1], ['bk_blaze',1], ['bk_elf_attrfire',1], ['scroll_attr_fire', 0.9], ['wpn_redflame_sword',0.1], ['wpn_redflame_bow',0.1]],   // 🆕 赤焰之劍/弓 各0.1%
        '伊萊克頓': [['acc_127',0.001], ['scroll_armor',1], ['new_item_151',5], ['new_item_152',0.5], ['new_item_153',0.1], ['bk_thunder',0.05], ['bk_summon',0.002], ['bk_thunder_storm',0.001], ['bk_ice_spike',0.5], ['bk_elf_lifespring',0.05], ['bk_blizzard_storm',0.002], ['wpn_eva_scold',0.001], ['wpn_thunder_sword',0.05]],   // 🆕 雷雨之劍 0.05%
        '侏儒': [['wpn_26',1], ['hlm_gnome',2], ['arm_86',5], ['shd_gnome',3], ['new_item_169',1], ['new_item_180',10]],
        '侏儒戰士': [['wpn_23',0.5], ['wpn_26',2], ['hlm_gnome',3], ['arm_86',5], ['shd_gnome',3], ['new_item_180',10]],
        '克特': [['acc_118',1],['wpn_12', 1], ['wpn_katana',1], ['wpn_longsword',10], ['wpn_2hsword',3], ['arm_60',5], ['tsh_tshirt',3], ['arm_87',10], ['arm_105',10], ['arm_106',0.5], ['arm_90',10], ['glv_glove',5], ['arm_110',1], ['arm_101',1], ['amr_kurt',1], ['arm_97',1], ['hlm_kurt',1], ['wpn_kurt_sword',0.1], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['bk_berserk',1], ['bk_shock_stun',1], ['bk_reduction_armor',0.5], ['bk_spike_armor',0.5], ['bk_solid_shield',0.5]],
        '冰原狼人': [['new_item_150',1], ['new_item_151',1], ['new_item_154',5], ['new_item_157',5], ['new_item_160',5]],
        '冰原老虎': [['scroll_acc',0.01], ['new_item_150',1], ['new_item_195',1], ['wpn_frost_spear',0.05]],   // 🆕 酷寒之矛 0.05%
        '冰石高崙': [['wpn_2',3], ['glv_crystal',0.01], ['bk_ice_lance',0.001], ['bk_ice_spike',0.5], ['bk_elf_lifespring',0.05], ['arm_stone_glove',0.05], ['new_item_150',5]],   // 🆕 石製手套 0.05%
        '卡司特': [['wpn_battleaxe',3], ['wpn_giantaxe',0.5], ['new_item_154',5], ['new_item_155',0.5], ['bk_summon',0.01]],
        '卡司特王': [['wpn_battleaxe',2], ['wpn_giantaxe',0.5], ['wpn_berserker',0.01], ['arm_45',0.1], ['scroll_weapon',1], ['scroll_armor',2], ['new_item_155',0.5], ['new_item_156',0.05], ['bk_disease',0.1]],
        '卡士柏': [['item_olin_diary',1],['arm_87',5], ['arm_90',10], ['arm_55',1], ['acc_117',0.01], ['amu_str',0.1], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_150',1], ['new_item_157',5], ['new_item_158',0.5], ['new_item_159',0.1], ['bk_fireball',5], ['bk_elf_dancefire',1], ['bk_elf_earthshield',1], ['bk_blaze',1], ['acc_119',0.1], ['acc_125',0.1], ['wpn_mana_orb',0.1]],   // 🆕 瑪那水晶球 0.1%
        '史巴托': [['hlm_mr', 0.5], ['wpn_scimitar',1], ['arm_42',3], ['arm_60',1], ['scroll_acc',0.001], ['arm_105',1], ['new_item_150',1], ['new_item_180',10]],
        '哈柏哥布林': [['hlm_mr', 0.5], ['wpn_9',3], ['arm_42',3], ['new_item_180',10], ['mat_steel_chunk',3]],
        '哈維': [['rng_harpy',0.01], ['arm_62',0.5], ['new_item_150',1], ['bk_haste_spell',0.5], ['bk_holy_dash',0.05], ['bk_greater_haste',0.01], ['new_item_195',1], ['bk_elf_stormeye',0.001]],
        '哥布林': [['hlm_mr', 0.05], ['wpn_9',1], ['wpn_10',1], ['arm_42',5], ['bot_short',3]],
        '地獄犬': [['wpn_strwand',0.1], ['wpn_witchwand',0.5], ['scroll_acc',0.01], ['new_item_150',1], ['new_item_157',5], ['new_item_158',0.5], ['new_item_159',0.1], ['bk_fireball',0.5], ['bk_break',0.5], ['bk_holy_barrier',0.001], ['new_item_195',1], ['mat_black_blood', 2]],
        '夢幻之島地精靈王': [['arm_69', 1], ['arm_63',5], ['scroll_weapon',5], ['scroll_armor',10], ['scroll_revive',1], ['panacea_con',1], ['mat_earth_breath',1], ['relic_earthking_resist',0.0001]],
        '地靈': [['wpn_10',3], ['bot_short',1], ['new_item_179',5]],
        '夏洛伯': [['bk_slow',0.1], ['bk_earthquake',0.01], ['scroll_acc',0.001], ['new_item_144',1]],
        '多眼怪': [['scroll_weapon',1], ['new_item_160',5], ['new_item_161',0.5], ['new_item_162',0.1], ['bk_mummy_curse',0.5], ['bk_cancel',0.05], ['bk_elf_release',0.1], ['bk_weaken',0.1], ['bk_disease',0.1], ['bk_elf_triple',0.01]],
        '多羅': [['wpn_battleaxe',3], ['wpn_giantaxe',0.8], ['wpn_berserker',0.01], ['arm_61',0.5], ['arm_45',0.05], ['acc_132',0.01], ['bk_heal2',0.5], ['bk_regen',0.01], ['acc_doro',0.1]],
        '奎斯坦修': [['acc_128',0.01], ['scroll_weapon',0.5], ['scroll_armor',1], ['scroll_acc',0.01], ['new_item_151',5], ['new_item_152',0.5], ['new_item_153',0.1], ['bk_weaken',1]],
        '妖魔': [['wpn_dagger1',1], ['wpn_25',1], ['wpn_27',5], ['hlm_oasis',1], ['amr_oasis',5], ['new_item_179',5]],
        '妖魔巡守': [['scroll_acc',0.001]],
        '妖魔弓箭手': [['wpn_8',1], ['hlm_oasis',2], ['arm_64',1], ['amr_oasis',5], ['clk_oasis',3], ['new_item_179',5]],
        '妖魔殭屍': [['wpn_33',0.1], ['hlm_oasis',2], ['arm_64',3], ['amr_oasis',5], ['arm_104',1]],
        '妖魔法師': [['wpn_oakwand',1], ['wpn_38',0.1], ['wpn_strwand',0.01], ['new_item_150',1], ['bk_heal2',0.01], ['bk_blaze',0.001], ['item_orc_elder_head',1], ['bk_soul_up',0.001]],
        '妖魔鬥士': [['arm_69', 0.1], ['hlm_oasis',2], ['arm_64',2], ['amr_oasis',3], ['clk_oasis',1], ['arm_104',1], ['arm_63',1], ['new_item_180',10]],
        '安塔瑞斯': [['wpn_katana',10], ['wpn_siruge',5], ['amr_plate',10], ['arm_88',1], ['glv_glove',20], ['arm_81',0.1], ['acc_116',0.1], ['acc_117',0.1], ['acc_121',1], ['acc_122',1], ['acc_127',5], ['acc_128',5], ['acc_129',5], ['blt_body',1], ['acc_130',1], ['acc_131',1], ['scroll_weapon',100], ['scroll_armor',100], ['scroll_acc',50], ['new_item_150',1], ['new_item_151',50], ['new_item_152',5], ['new_item_153',1], ['new_item_154',50], ['new_item_155',5], ['new_item_156',1], ['bk_break',10], ['bk_slow',10], ['bk_charm',10], ['bk_str_up',5], ['bk_earthquake',5], ['bk_regen',5], ['bk_summon',2], ['bk_resurrection',1], ['new_item_191',100], ['bk_counter_barrier',1], ['bk_elf_earthbless',30]],
        '安普長老': [['new_item_150',1], ['new_item_154',5], ['new_item_179',50], ['new_item_182',1], ['bk_rock_prison',0.1]],
        '密密': [['wpn_greatsword',1], ['hlm_mr', 1], ['arm_42',1], ['arm_59',0.1], ['bot_demon',0.05], ['glv_demon',0.05], ['bk_abs_barrier',0.01], ['bk_soul_up',0.01]],
        '巨大兵蟻': [['new_item_211',1],['arm_60',0.3], ['arm_47',0.01], ['new_item_154',5], ['new_item_155',0.5], ['new_item_156',0.1], ['new_item_157',5], ['new_item_158',0.5], ['new_item_159',0.1]],
        '巨大鱷魚': [['scroll_armor',0.1], ['scroll_acc',0.01], ['new_item_154',0.1], ['bk_thunder',0.1], ['bk_elf_watervital',0.1]],
        '巨蟻': [['arm_45',0.01], ['new_item_154',5]],
        '巨蟻女皇': [['acc_126',1],['arm_69', 10], ['wpn_katana',3], ['amr_plate',5], ['arm_63',5], ['arm_47',1], ['acc_121',0.1], ['acc_127',1], ['blt_body',0.5], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_150',1], ['new_item_154',5], ['new_item_155',0.5], ['new_item_156',0.1], ['new_item_157',5], ['new_item_158',0.5], ['new_item_159',0.1], ['bk_heal2',1], ['bk_charm',1], ['bk_earthquake',1], ['bk_regen',0.5], ['bk_rock_prison',5], ['bk_greater_haste',1], ['new_item_195',1], ['bk_elf_magicerase',1], ['bk_dark_shadow',1], ['clk_antqueen_gold',0.1], ['clk_antqueen_silver',0.1], ['wpn_claw_abyss',0.05], ['bk_elf_physboost',5], ['bk_elf_earthbless',5], ['wpn_ancient_darkelf_sword',0.1], ['wpn_ancient_elf_xbow',0.1], ['scroll_attr_earth', 3]],
        '巫師': [['item_olin_diary',0.01],['arm_87',0.5], ['arm_90',1], ['amu_str',0.001], ['scroll_weapon',1], ['scroll_armor',2], ['scroll_acc',0.01], ['new_item_151',5], ['new_item_152',0.5], ['new_item_153',0.1], ['bk_dex_up',0.1], ['bk_haste_spell',0.1], ['bk_greater_haste',0.05], ['bk_elf_stormeye',0.05], ['bk_weaken',0.1], ['item_crystal_ball',0.01], ['acc_119',0.01], ['acc_125',0.01], ['new_item_150',10]],
        '巴土瑟': [['item_olin_diary',1],['arm_87',5], ['arm_90',10], ['arm_54',1], ['acc_117',0.01], ['amu_int',0.1], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_150',1], ['new_item_154',5], ['new_item_155',0.5], ['new_item_156',0.1], ['bk_cancel',0.1], ['bk_quake',0.1], ['bk_elf_groundtrap',5], ['bk_elf_earthbless',1], ['acc_119',0.1], ['acc_125',0.1], ['relic_rockmage_secret',0.0001]],
        '巴拉卡斯': [['wpn_katana',10], ['wpn_siruge',5], ['amr_plate',10], ['arm_88',1], ['glv_glove',10], ['arm_82',0.1], ['acc_116',0.2], ['acc_117',0.2], ['amu_str',0.2], ['amu_int',0.2], ['acc_127',6], ['acc_128',6], ['acc_129',6], ['blt_body',1], ['acc_130',1], ['acc_131',1], ['scroll_weapon',100], ['scroll_armor',100], ['scroll_acc',50], ['new_item_150',1], ['new_item_151',100], ['new_item_152',10], ['new_item_153',2], ['new_item_157',100], ['new_item_158',10], ['new_item_159',2], ['bk_fireball',20], ['bk_slow',15], ['bk_charm',15], ['bk_str_up',10], ['bk_haste_spell',10], ['bk_summon',3], ['bk_invisible',1], ['bk_resurrection',1], ['new_item_192',100]],
        '巴風特': [['wpn_katana',2], ['wpn_2hsword',5], ['amr_plate',5], ['arm_88',0.1], ['glv_glove',10], ['acc_116',0.01], ['acc_127',0.5], ['acc_129',0.5], ['blt_body',0.1], ['acc_131',0.1], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_150',1], ['new_item_151',5], ['new_item_152',0.5], ['new_item_153',0.1], ['new_item_154',5], ['new_item_155',0.5], ['new_item_156',0.1], ['new_item_161',0.5], ['new_item_162',0.1], ['bk_charm',1], ['bk_earthquake',2], ['bk_summon',0.2], ['bk_rock_prison',5], ['bk_quake',1], ['new_item_195',1], ['bk_elf_dancefire',1], ['bk_magic_shield',1], ['bk_weaken',1], ['bk_bless_wpn',0.1], ['amu_cha',1], ['bk_elf_stormshot',1], ['bk_elf_mirror',1], ['bk_elf_flamesoul',0.01], ['bk_fire_prison',0.5], ['wpn_powerless_baphomet',0.1], ['amr_baphomet',1], ['scroll_attr_earth', 1.2]],
        '希爾黛斯': [['new_item_160',0.5], ['new_item_161',0.5], ['new_item_162',0.1], ['bk_slow',0.5], ['bk_ice_lance',0.001], ['bk_ice_spike',0.5], ['bk_elf_lifespring',0.1], ['bk_elf_lifebless',0.01],['new_item_213',1], ['bk_elf_watervital',0.1]],
        '強盜': [['wpn_20', 0.5], ['arm_69', 0.5], ['hlm_mr', 0.5], ['wpn_shortbow',1], ['wpn_32',0.01], ['arm_42',2], ['arm_66',3], ['arm_98',0.1], ['arm_49',1], ['item_death_oath',1], ['new_item_226',1]],   // ⚔️ 戰士試煉：被偷的戒指 1%（warrior 限定）
        '強盜頭目': [['hlm_mr', 5], ['wpn_katana',1], ['wpn_silversword',3], ['arm_62',5], ['arm_87',5], ['scroll_acc',0.1], ['arm_42',10], ['new_item_152',0.5], ['new_item_153',0.1], ['new_item_155',0.5], ['new_item_156',0.1], ['new_item_158',0.5], ['new_item_159',0.1], ['new_item_161',0.5], ['new_item_162',0.1], ['item_nightvision',10], ['new_item_225',10]],   // ⚔️ 戰士試煉：被偷的項鍊 10%
        '影魔': [['acc_129',0.005], ['acc_131',0.001], ['bk_ice_spike',0.5], ['bk_magic_shield',0.01], ['bk_dark_shadow',0.1]],
        '思克巴': [['acc_117',0.001], ['bk_ice_lance',0.01], ['bk_summon',0.02], ['bk_blizzard',0.005], ['bk_ice_spike',0.5], ['bk_elf_release',0.1], ['bk_elf_lifespring',0.1], ['bk_elf_triple',0.05], ['bot_dark',0.3], ['acc_summon_ctrl',0.001], ['bk_dark_double',0.1], ['bk_dark_fang',0.1], ['new_item_219',1], ['bk_full_heal',0.1], ['new_item_150',5]],   // ⚔️ 戰士試煉：神秘魔杖 1%　🆕 全部治癒術 0.1%
        '思克巴女皇': [['acc_116',0.001], ['scroll_acc',0.01], ['bk_ice_lance',0.01], ['bk_summon',0.003], ['bk_ice_spike',0.5], ['bk_elf_lifespring',0.1], ['bk_mana_drain',0.1], ['bk_blizzard_storm',0.01], ['new_item_219',1], ['new_item_150',5]],   // ⚔️ 戰士試煉：神秘魔杖 1%
        '怪手': [['glv_glove',0.1], ['arm_99',0.001], ['new_item_150',1]],
        '惡魔': [['arm_69', 10], ['wpn_katana',5], ['wpn_2hsword',10], ['wpn_siruge',1], ['wpn_33',1], ['wpn_flaming_angel',0.5], ['amr_plate',5], ['arm_88',0.1], ['arm_63',10], ['arm_99',1], ['acc_117',0.01], ['amu_str',0.1], ['amu_int',0.15], ['acc_128',1], ['acc_129',1], ['acc_130',0.5], ['acc_131',0.5], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_152',0.5], ['new_item_153',0.1], ['new_item_159',0.1], ['bk_holy_barrier',0.5], ['bk_fire_storm',0.1], ['bk_elf_blazewpn',0.5], ['wpn_demon_scythe',0.1], ['arm_59',10], ['hlm_demon',1], ['amr_demon',1], ['glv_demon',1], ['bot_demon',1], ['wpn_dual_abyss',0.1], ['bk_elf_flamesoul',0.1], ['wpn_vengeance',0.1], ['wpn_hate_claw',0.01], ['scroll_attr_fire', 1], ['wpn_shaha_bow',0.01]],   // 🆕 沙哈之弓 0.01%
        '杜賓狗': [['new_item_179',10]],   // 🚫 v3.2.17 肉已移除
        '格利芬': [['arm_62',0.5], ['new_item_150',1], ['new_item_152',0.5], ['new_item_155',0.5], ['new_item_158',0.5], ['new_item_161',0.5], ['bk_tornado',0.001], ['bk_elf_release',0.1], ['bk_elf_winddash',0.05], ['bk_elf_stormeye',0.001], ['bk_magic_shield',0.01], ['mat_griffon_feather',1], ['acc_demonbane',0.01]],
        '楊果里恩': [['scroll_weapon',0.1], ['scroll_armor',0.3], ['scroll_acc',0.01], ['bk_slow',0.1], ['bk_charm',0.05], ['bk_rock_prison',0.5]],
        '歐吉': [['wpn_battleaxe',5], ['wpn_giantaxe',1], ['wpn_berserker',0.01], ['arm_61',0.5], ['arm_47',0.03], ['acc_133',0.001], ['scroll_weapon',0.3], ['scroll_armor',1], ['new_item_167',0.01]],
        '歐熊': [['new_item_182',3], ['scroll_acc',0.001]],
		'熊': [['new_item_179',1], ['acc_bear_ring',0.001]],
        '死亡騎士': [['acc_118',1],['wpn_katana',5], ['wpn_2hsword',10], ['wpn_33',1], ['amr_plate',5], ['arm_88',0.1], ['glv_glove',10], ['glv_dk',1], ['amr_dk',1], ['bot_dk',1], ['hlm_dk',1], ['acc_117',1], ['amu_str',0.1], ['acc_128',0.5], ['acc_129',0.5], ['acc_130',0.1], ['acc_131',0.1], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_150',1], ['new_item_151',5], ['new_item_152',0.5], ['new_item_153',0.1], ['bk_zombie',3], ['bk_tornado',0.5], ['bk_resurrection',0.1], ['bk_disease',3], ['bk_solid_shield',1], ['bk_blaze',1], ['wpn_dk_flameblade',0.1], ['bk_counter_barrier',0.1], ['bk_elf_mirror',1], ['scroll_attr_earth', 2.4]],
        '死神': [['item_olin_diary',0.01],['wpn_16',1], ['wpn_giantaxe',0.1], ['wpn_flaming_angel',0.001], ['arm_61',0.5], ['scroll_weapon',1], ['scroll_armor',2], ['scroll_acc',0.01], ['bk_elf_stormshot',0.01], ['bk_disease',0.1], ['glv_reaper',0.01], ['mat_moonlight_breath', 0.01]],
        '毒蠍': [['arm_46',0.01], ['bk_thunder',0.01], ['bk_cancel',0.01], ['bk_rock_prison',0.5], ['bk_quake',0.001]],
        '夢幻之島水精靈王': [['arm_69', 1], ['arm_63',5], ['scroll_weapon',5], ['scroll_armor',10], ['scroll_revive',1], ['panacea_int',1], ['mat_water_breath',1], ['relic_waterking_caress',0.0001]],
        '污染的潘': [['new_item_163',10]],
		'污染的安特': [['new_item_141',1], ['new_item_237',10], ['item_ant_fruit',1], ['item_ant_branch',1], ['item_ant_bark',1]],
        '法利昂': [['wpn_katana',10], ['wpn_siruge',5], ['amr_plate',10], ['arm_88',1], ['glv_glove',20], ['arm_80',0.1], ['acc_116',0.1], ['acc_117',0.1], ['acc_120',1], ['acc_127',5], ['acc_128',5], ['acc_129',5], ['blt_body',1], ['acc_130',1], ['acc_131',1], ['scroll_weapon',100], ['scroll_armor',100], ['scroll_acc',50], ['new_item_150',1], ['new_item_151',50], ['new_item_152',5], ['new_item_153',1], ['new_item_160',50], ['new_item_161',5], ['new_item_162',1], ['bk_slow',10], ['bk_holy_light',10], ['bk_regen',5], ['bk_summon',2], ['bk_blizzard',1], ['bk_resurrection',1], ['new_item_190',100], ['bk_elf_eleres',1], ['bk_counter_barrier',1], ['scroll_attr_water', 5]],
        '活鎧甲': [['item_olin_diary',0.01],['wpn_battleaxe',1], ['arm_60',1], ['arm_62',1], ['bk_holy_barrier',0.003], ['bk_weaken',0.1], ['mat_black_blood', 1], ['mat_moonlight_breath', 0.01], ['bk_regen',0.01]],   // 🆕 體力回復術 0.01%
        '海星': [['bk_ice_spike',0.1], ['scroll_acc',0.01]],
        '漂浮之眼': [['item_eye_meat',10], ['new_item_150',1]],   // 🐾 v3.2.17 漂浮之眼肉 10%（一般誘捕道具·原 肉×20 已移除）
        '火炎蛋': [['scroll_weapon',1], ['scroll_armor',2], ['bk_fireball',0.1], ['bk_holy_light',0.1], ['scroll_poly',1], ['new_item_192',0.01], ['bk_fire_prison',0.01], ['bk_elf_attrfire',0.01]],
        '火焰弓箭手': [['hlm_mr', 1], ['wpn_32',0.1], ['arm_42',2], ['arm_67',4], ['arm_90',1], ['bk_dex_up',0.05], ['bk_slow',0.1], ['new_item_192',0.01], ['wpn_redflame_sword',0.1], ['wpn_redflame_bow',0.1]],   // 🆕 赤焰之劍/弓 各0.1%
        '火焰戰士': [['hlm_mr', 1], ['wpn_longsword',1], ['arm_42',2], ['arm_62',1], ['arm_105',3], ['new_item_192',0.01], ['wpn_redflame_sword',0.1], ['wpn_redflame_bow',0.1]],   // 🆕 赤焰之劍/弓 各0.1%
        '夢幻之島火精靈王': [['arm_69', 1], ['arm_63',5], ['scroll_weapon',5], ['scroll_armor',10], ['scroll_revive',1], ['panacea_str',1], ['mat_fire_breath',1], ['relic_fireking_blast',0.0001]],
        '火蜥蜴': [['new_item_155',0.5], ['new_item_158',0.5], ['new_item_192',0.01], ['bk_fire_storm',0.001], ['bk_elf_magicerase',0.01], ['bk_elf_stormeye',0.01], ['bk_shock_stun',0.01], ['bk_elf_attrfire',0.01], ['bk_holy_dash',0.1]],   // 🆕 神聖疾走 0.1%
        '烈炎獸': [['scroll_weapon',1], ['scroll_armor',2], ['bk_holy_barrier',0.002], ['scroll_acc',0.01], ['new_item_192',0.01], ['bk_elf_magicerase',0.1], ['bk_shock_stun',0.05], ['bk_elf_attrfire',0.05], ['wpn_greatsword',0.1]],   // 🆕 巨劍 0.1%
        '熔岩高崙': [['wpn_2hsword',0.5], ['wpn_18',1], ['wpn_giantaxe',0.5], ['bk_slow',0.5], ['bk_str_up',0.05], ['scroll_acc',0.01], ['new_item_192',0.01], ['bk_elf_triple',0.01], ['item_time_orb',1], ['arm_stone_glove',0.05], ['new_item_150',5]],   // 🆕 石製手套 0.05%
        '爆彈花': [['bk_sleep_mist',0.01], ['scroll_acc',0.01]],
        '牧羊犬': [['new_item_179',10]],   // 🚫 v3.2.17 肉已移除
		'哈士奇': [['new_item_179',10]],   // 🚫 v3.2.17 肉已移除
        '狼': [['new_item_195',1], ['new_item_179',10]],
        '狼人': [['arm_69', 0.1], ['wpn_longsword',0.1], ['wpn_2',1], ['wpn_10',3], ['wpn_13',2], ['arm_66',0.5], ['arm_103',1], ['bot_short',0.5], ['bk_dex_up',0.01], ['bk_vampire',0.05]],
        '獨眼巨人': [['arm_62',1], ['arm_47',0.01], ['scroll_weapon',1], ['scroll_armor',2], ['scroll_acc',0.01], ['bk_str_up',0.05], ['bk_summon',0.002], ['bk_rock_prison',0.5], ['bk_quake',0.003], ['bk_elf_groundtrap',0.1], ['bk_elf_earthbless',0.01], ['bk_weaken',0.1], ['bk_seal',0.05], ['acc_demonbane',0.01], ['item_cyclops_blood',1]],   // ⚔️ 戰士試煉：獨眼巨人的血 1%
        '獨角獸': [['wpn_18',3], ['scroll_weapon',5], ['scroll_armor',10], ['scroll_poly',1], ['panacea_cha',1], ['mat_unicorn_horn',0.1], ['relic_pure_maiden_love',0.0001]],
        '甘地妖魔': [['new_item_148',1], ['new_item_150',1], ['new_item_201',1], ['item_orc_amulet',0.01]],
        '卡瑞': [['wpn_dragonslayer',100]],
        '巴列斯': [['wpn_katana',2], ['wpn_2hsword',5], ['wpn_powerless_baless',1], ['amr_plate',10], ['glv_glove',10], ['bot_baless',1], ['acc_122',1], ['acc_116',0.1], ['rng_mr',1], ['acc_127',0.5], ['acc_128',0.5], ['acc_129',0.5], ['blt_body',0.1], ['acc_130',0.1], ['acc_131',0.1], ['new_item_151',50], ['new_item_157',50], ['new_item_152',5], ['new_item_158',5], ['new_item_153',1], ['new_item_159',1], ['scroll_weapon',10], ['scroll_armor',20], ['bk_magic_shield',3], ['bk_heal2',3], ['bk_zombie',2], ['bk_blaze',1], ['bk_disease',1], ['bk_full_heal',1], ['bk_fire_storm',0.5], ['bk_elf_winddash',3], ['bk_elf_stormeye',2], ['bk_elf_stormshot',1], ['scroll_attr_earth', 1.8]],
        '石頭高崙': [['wpn_alien',3], ['wpn_1',5], ['wpn_10',5], ['wpn_13',1], ['new_item_150',1], ['new_item_159',0.05], ['new_item_164',1], ['bk_rock_prison',0.5], ['acc_demonbane',0.0001], ['new_item_207',1], ['arm_stone_glove',0.05]],   // ⚔️ 戰士試煉：生命的卷軸 1%（warrior 限定·非戰士不掉）　🆕 石製手套 0.05%
        '穴居人': [['wpn_battleaxe',1], ['wpn_giantaxe',0.1], ['arm_61',0.5], ['scroll_acc',0.001], ['bk_blizzard_storm',0.001]],
        '紅鬼魂': [['item_lost_soul',1],['amr_robe',3], ['glv_crystal',0.01], ['bk_elf_seal',0.05], ['bk_dark_shadow',0.1], ['item_soul_orb',0.01], ['mat_moonlight_breath', 0.01], ['relic_magic_resist_shirt',0.0001]],
        '紙人': [['item_olin_diary',0.01],['scroll_poly',1], ['scroll_acc',0.01], ['new_item_150',5]],
        '羅孚妖魔': [['arm_69', 0.2], ['arm_63',3], ['new_item_149',1], ['new_item_157',5], ['item_orc_amulet',0.01], ['wpn_osis_hammer',0.0005]],
        '艾爾摩士兵': [['wpn_4',1], ['wpn_halberd',0.5], ['wpn_14',1], ['arm_66',3], ['arm_68',2], ['bot_short',2], ['glv_glove',0.5], ['scroll_armor',2], ['scroll_acc',0.01], ['wpn_frost_spear',0.05], ['wpn_crimson_spear',0.05]],   // 🆕 酷寒之矛 0.05%、深紅長矛 0.05%
        '艾爾摩將軍': [['wpn_greatsword',0.1], ['wpn_2hsword',0.5], ['arm_60',1], ['arm_65',1], ['arm_90',1], ['glv_glove',0.5], ['scroll_weapon',1], ['scroll_armor',2], ['scroll_acc',0.01], ['bk_shock_stun',0.05], ['bk_reduction_armor',0.01], ['bk_spike_armor',0.001], ['item_elmore_heart',1]],
        '艾爾摩法師': [['wpn_witchwand',1], ['scroll_weapon',1], ['bk_full_heal',0.01], ['bk_ice_spike',0.5], ['bk_bless_wpn',0.005], ['wpn_qigu_meditate',0.0001], ['bk_mana_drain',0.1], ['wpn_angel_wand',0.01]],   // 🆕 魔力奪取 0.1%；😇 v3.7.74 天使魔杖 0.01%
        '莫妮亞': [['arm_87',1], ['scroll_weapon',1], ['scroll_armor',1.5], ['bk_slow',0.5], ['bk_heal2',0.5], ['bk_holy_light',0.1], ['scroll_poly',1]],
        '萊肯': [['wpn_battleaxe',3], ['wpn_halberd',0.5], ['arm_65',1], ['arm_66',1], ['arm_105',2], ['arm_90',1], ['new_item_151',5], ['bk_dex_up',0.05], ['bk_vampire',0.1], ['bk_slow',0.1], ['new_item_195',1]],
        '蘑菇': [['new_item_166',10]],
        '蛇女': [['scroll_weapon',0.2], ['scroll_acc',0.01], ['bk_break',0.5], ['new_item_221',1], ['new_item_208',1], ['bk_elf_watervital',0.05]],
        '蜥蜴人': [['hlm_mr', 0.5], ['wpn_37',0.5], ['arm_105',1], ['arm_42',3], ['new_item_160',5], ['scroll_acc',0.001]],
        '蟑螂人': [['hlm_mr', 0.3], ['arm_42',3], ['new_item_158',0.1]],
        '蟹人': [['scroll_armor',0.3], ['bk_break',0.1], ['bk_str_up',0.01]],
        '西瑪': [['item_olin_diary',1],['arm_87',5], ['arm_90',10], ['arm_57',1], ['amu_str',0.1], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_150',1], ['new_item_151',5], ['new_item_152',0.5], ['new_item_153',0.1], ['bk_dex_up',2], ['bk_haste_spell',1], ['bk_greater_haste',1], ['bk_elf_stormeye',1], ['bk_weaken',1], ['acc_119',0.1], ['acc_125',0.1], ['acc_orin_amulet',0.1], ['acc_sima_ring',0.1]],
        '變形怪': [['scroll_poly',1], ['scroll_acc',0.01], ['new_item_240',1], ['acc_demonbane',0.01]],
        '變形怪首領': [['wpn_greatsword',1], ['wpn_2hsword',5], ['wpn_38',10], ['wpn_strwand',1], ['arm_60',10], ['clk_mr',10], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['bk_fireball',3], ['bk_str_up',1], ['bk_haste_spell',1], ['bk_summon',0.5], ['scroll_poly',1], ['bk_elf_magicerase',1], ['bk_shock_stun',1], ['bk_reduction_armor',0.5], ['bk_spike_armor',0.5], ['bk_solid_shield',0.5], ['new_item_240',10], ['bk_elf_stormshot',0.5], ['bk_elf_physboost',1.5], ['scroll_attr_wind', 0.6]],
        '那魯加妖魔': [['wpn_2hsword',0.1], ['wpn_invader',0.5], ['wpn_damascus',0.2], ['arm_64',5], ['arm_104',3], ['acc_123',0.01], ['new_item_146',1], ['new_item_157',5], ['new_item_200',1], ['item_orc_amulet',0.01], ['wpn_osis_hammer',0.0005]],
        '邪惡蜥蜴': [['scroll_weapon',1], ['scroll_armor',2], ['scroll_acc',0.01], ['new_item_151',5], ['new_item_152',0.5], ['new_item_153',0.1], ['bk_slow',0.5], ['bk_heal2',0.2], ['bk_holy_light',0.1], ['bk_cancel',0.02], ['bk_earthquake',0.02], ['bk_rock_prison',0.5], ['bk_quake',0.005], ['bk_elf_release',0.05], ['new_item_232',0.01], ['item_lizard_horn',0.01], ['glv_demon',0.01], ['acc_demonbane',0.01], ['bk_elf_watervital',0.1]],
        '都達瑪拉妖魔': [['hlm_mr', 0.5], ['arm_104',3], ['arm_42',5], ['acc_123',0.01], ['new_item_147',1], ['new_item_150',1], ['new_item_158',0.5], ['new_item_199',1], ['scroll_acc',0.001], ['item_orc_amulet',0.01], ['wpn_osis_hammer',0.0005]],
        '鋼鐵高崙': [['mat_golem_heart',0.1],['scroll_weapon',1], ['scroll_armor',2], ['bk_str_up',0.05], ['new_item_164',1], ['new_item_180',100], ['bk_elf_soul',0.001], ['bk_elf_steelguard',0.001], ['bk_weaken',0.1], ['item_ancientkey',1], ['arm_stone_glove',0.05], ['new_item_150',5], ['mat_steel_chunk',10]],   // 🆕 石製手套 0.05%
        '夢幻之島鎧甲守衛': [['arm_60',1], ['scroll_weapon',1], ['scroll_armor',2], ['bk_spike_armor',0.05], ['wpn_greatsword',0.1]],   // 🆕 巨劍 0.1%
        '長老': [['item_olin_diary',0.001],['arm_87',0.5], ['new_item_150',1], ['bk_thunder',0.1], ['bk_heal2',0.5], ['scroll_acc',0.01], ['acc_119',0.001], ['acc_125',0.001]],
        '夢幻之島閃電球': [['arm_45',0.1], ['scroll_weapon',1], ['scroll_armor',2], ['bk_thunder_storm',0.05], ['wpn_thunder_sword',0.05]],   // 🆕 雷雨之劍 0.05%
        '阿吐巴妖魔': [['hlm_mr', 0.5], ['wpn_damascus',0.1], ['arm_60',0.5], ['arm_64',3], ['arm_104',3], ['arm_42',5], ['acc_123',0.01], ['new_item_145',1], ['new_item_157',5], ['new_item_202',1], ['item_orc_amulet',0.01]],
        '阿西塔基奧': [['scroll_weapon',1], ['scroll_armor',2], ['scroll_acc',0.01], ['bk_fireball',0.5], ['bk_dex_up',0.1], ['bk_str_up',0.05], ['bk_haste_spell',0.1], ['bk_earthquake',0.1], ['new_item_192',0.01], ['new_item_194',1], ['bk_elf_attrfire',0.05]],
        '阿魯巴': [['wpn_18',2], ['bk_str_up',0.05], ['bk_haste_spell',0.5], ['bk_earthquake',0.1], ['bk_rock_prison',0.5], ['bk_greater_haste',0.1], ['bk_quake',0.005], ['acc_demonbane',0.01]],
        '雪人': [['bk_elf_release',0.1], ['scroll_acc',0.01]],
        '雪怪': [['wpn_18',1], ['scroll_acc',0.01], ['new_item_195',1], ['item_yeti_head',1], ['bk_elf_watervital',0.1], ['bk_sleep_mist',0.1], ['wpn_frost_spear',0.05]],   // 🆕 沉睡之霧 0.1%、酷寒之矛 0.05%
        '夢幻之島風精靈王': [['arm_69', 1], ['arm_63',5], ['scroll_weapon',5], ['scroll_armor',10], ['scroll_revive',1], ['panacea_dex',1], ['mat_wind_breath',1], ['relic_windking_roar',0.0001]],
        '飛龍': [['mat_dragon_heart',1],['item_dragon_claw',1], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_150',1], ['new_item_151',5], ['new_item_152',0.5], ['new_item_153',0.1], ['new_item_154',5],['new_item_155',0.5], ['new_item_156',0.1], ['new_item_157',5], ['new_item_158',0.5], ['new_item_159',0.1], ['new_item_160',5], ['new_item_161',0.5], ['new_item_162',0.1], ['bk_holy_dash',1], ['bk_quake',1], ['bk_elf_magicerase',1], ['bk_elf_stormeye',1], ['bk_elf_triple',1], ['glv_demon',0.1], ['acc_demonbane',0.2], ['wpn_ori_dagger',1], ['bk_elf_preciseshot',0.3], ['scroll_attr_wind', 0.2]],
        '食人妖精': [['wpn_battleaxe',3], ['wpn_giantaxe',1], ['arm_61',0.6], ['scroll_weapon',0.2], ['scroll_armor',0.5], ['bk_fireball',0.1], ['bk_break',0.5], ['bk_elf_release',0.05], ['bk_blaze',0.01], ['acc_demonbane',0.001]],
        '食人妖精王': [['wpn_battleaxe',3], ['wpn_10',2], ['wpn_giantaxe',0.5], ['wpn_berserker',0.02], ['arm_61',0.5], ['arm_47',0.05], ['scroll_weapon',1], ['scroll_armor',1.5], ['new_item_158',0.5], ['bk_fireball',0.5], ['bk_break',0.5], ['bk_holy_light',0.1], ['bk_disease',0.1], ['bk_shock_stun',0.01]],
        '食屍鬼': [['scroll_weapon',0.1], ['bk_berserk',0.01], ['new_item_204',1], ['new_item_205',1]],
        '馬庫爾': [['item_olin_diary',1],['arm_87',5], ['arm_90',10], ['arm_56',1], ['acc_116',0.01], ['amu_str',0.1], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_150',1], ['new_item_160',5], ['new_item_161',0.5], ['new_item_162',0.1], ['bk_elf_soul',1], ['bk_elf_lifespring',1], ['acc_119',0.1], ['acc_125',0.1]],
        '骷髏': [['hlm_mr', 0.1], ['wpn_scimitar',1], ['arm_42',5], ['clk_mr',0.1], ['arm_105',0.5], ['new_item_150',1], ['bk_dex_up',0.01], ['new_item_183',5], ['new_item_203',1], ['new_item_214',1], ['mat_steel_chunk',3]],
        '骷髏弓箭手': [['hlm_mr', 0.1], ['wpn_3',1], ['arm_42',3], ['clk_mr',0.1], ['new_item_150',1], ['bk_dex_up',0.01], ['new_item_183',5]],
        '骷髏斧手': [['hlm_mr', 0.1], ['wpn_1',5], ['arm_42',3], ['clk_mr',0.3], ['new_item_150',1], ['new_item_183',5]],
        '骷髏槍兵': [['hlm_mr', 0.1], ['wpn_4',3], ['arm_42',3], ['clk_mr',0.3], ['new_item_150',1], ['bk_dex_up',0.01], ['new_item_183',5]],
        '骷髏神射手': [['wpn_3',3], ['arm_42',3], ['clk_mr',1], ['arm_105',2], ['acc_120',0.001], ['new_item_150',1], ['bk_dex_up',0.05], ['bk_charm',0.1], ['new_item_212',1]],
        '骷髏警衛': [['wpn_14',2], ['arm_42',3], ['clk_mr',1], ['arm_105',2], ['new_item_150',1], ['bk_dex_up',0.05], ['bk_charm',0.1], ['new_item_212',0.1]],
        '骷髏鬥士': [['wpn_battleaxe',3], ['arm_42',3], ['clk_mr',1], ['arm_105',2], ['new_item_150',1], ['bk_dex_up',0.05], ['bk_haste_spell',0.1], ['bk_solid_shield',0.01]],
        '鬼魂': [['item_lost_soul',1],['amr_robe',5], ['glv_crystal',0.01], ['bk_elf_seal',0.01], ['bk_magic_shield',0.01], ['bk_weaken',0.5], ['item_soul_orb',0.01], ['mat_moonlight_breath', 0.01], ['wpn_shaha_bow',0.01], ['wpn_mana_orb',0.1]],   // 🆕 沙哈之弓 0.01%、瑪那水晶球 0.1%
        '鯊魚': [['acc_129',0.01], ['new_item_160',5], ['new_item_161',0.1], ['new_item_162',0.1]],
        '鱷魚': [['arm_45',0.01], ['new_item_154',5], ['bk_thunder',0.005]],
        '黑暗精靈': [['item_wind_tear',1], ['amr_darkelf',0.1], ['bot_darkelf',0.1], ['wpn_elfbow',0.5], ['clk_elf',0.5], ['arm_71',0.3], ['bk_tornado',0.001], ['bk_invisible',0.001], ['new_item_195',1], ['bk_elf_release',0.1], ['bk_meditation',0.1], ['item_blueflute',1], ['mat_black_blood', 1]],
        '黑長者': [['item_olin_diary',1],['acc_126',1],['clk_mr',10], ['glv_glove',5], ['arm_84',1], ['arm_96',1], ['acc_130',0.1], ['scroll_weapon',10], ['scroll_armor',20], ['scroll_acc',1], ['new_item_150',1], ['bk_thunder',3], ['bk_charm',1], ['bk_str_up',1], ['bk_ice_spike',5], ['new_item_195',1], ['bk_elf_soul',1], ['bk_elf_lifespring',1], ['acc_119',1], ['acc_125',1], ['bk_elf_watervital',3], ['wpn_mana_orb',0.1]],   // 🆕 瑪那水晶球 0.1%
        '黑騎士': [['hlm_mr', 0.5], ['wpn_2hsword',0.1], ['wpn_16',1], ['wpn_17',1], ['wpn_21',2], ['wpn_28',3], ['arm_42',5], ['arm_60',1], ['tsh_tshirt',0.1], ['arm_87',1], ['bot_short',2], ['arm_90',1], ['new_item_151',5], ['new_item_154',5], ['new_item_157',5], ['new_item_160',5], ['new_item_196',1], ['new_item_198',1], ['acc_doro',0.01]],
        '黑騎士搜索隊': [['new_item_197', 100], ['hlm_mr', 0.5], ['wpn_2hsword',0.1], ['wpn_16',1], ['wpn_17',1], ['wpn_21',2], ['wpn_28',3], ['arm_42',5], ['arm_60',1], ['tsh_tshirt',0.1], ['arm_87',1], ['bot_short',2], ['arm_90',1], ['new_item_151',5], ['new_item_154',5], ['new_item_157',5], ['new_item_160',5], ['acc_doro',0.01]],
        '鼠人': [['arm_61',0.5], ['bk_dex_up',0.05], ['bk_haste_spell',0.1]],
        '龍蠅': [['scroll_weapon',1], ['scroll_armor',2], ['bk_vampire',0.5], ['new_item_192',0.01]],
        '龍龜': [['bk_cancel',0.01], ['scroll_acc',0.01], ['bk_ice_spike',0.5], ['new_item_206',1], ['bk_elf_watervital',0.1]],
        // ===== 🗼 傲慢之塔 =====
        '變種蛇女': [['scroll_acc',0.0001],['scroll_weapon',1], ['item_pride_scroll_11',2]],
        '變種楊果里恩': [['scroll_weapon',0.5], ['scroll_armor',1], ['item_pride_scroll_11',2]],
        '梅杜莎': [['arm_61',3], ['arm_pride_medusa_shield',0.5], ['arm_106',0.1], ['amu_cha',0.01], ['scroll_weapon',0.5], ['scroll_armor',1], ['item_pride_scroll_11',2], ['bk_cancel',0.3], ['bk_weaken',0.3], ['bk_holy_barrier',0.05], ['bk_resurrection',0.1], ['bk_dark_double',0.1], ['new_item_190',0.001]],
        '奇美拉': [['mat_chimera_snake',10], ['mat_chimera_dragon',10], ['mat_chimera_goat',10], ['mat_chimera_lion',10], ['item_pride_scroll_11',2], ['new_item_191',0.001]],
        '扭曲的潔尼斯女王': [['acc_138',1],['wpn_crystal_dagger',0.5], ['wpn_katana',30], ['wpn_2hsword',30], ['wpn_siruge',1], ['arm_88',0.1], ['arm_69',30], ['arm_59',3], ['amr_plate',30], ['arm_99',0.1], ['acc_jenis_ring',0.01], ['acc_128',5], ['acc_130',1], ['scroll_weapon',30], ['scroll_armor',30], ['bk_dark_shadow',5], ['bk_weaken',5], ['bk_slow',5], ['bk_dark_fang',5], ['item_pride_scroll_11',30], ['item_pride_sealed_11',1]],
        // ===== 🗼 傲慢之塔 11~20 樓 =====
        '魔狼': [['item_pride_scroll_21',2], ['new_item_192',0.001]],
        '邪惡密密': [['hlm_mr',0.3], ['scroll_armor',1], ['item_pride_scroll_21',2], ['bk_dex_up',0.5], ['bk_str_up',0.2], ['bk_dark_fang',0.1], ['new_item_190',0.001]],
        '邪惡多眼怪': [['scroll_acc',0.0001],['hlm_dark',0.3], ['scroll_weapon',0.5], ['item_pride_scroll_21',2], ['bk_mummy_curse',0.8], ['bk_cancel',0.3], ['bk_weaken',0.3], ['bk_disease',0.05], ['bk_dark_fang',0.1], ['bk_dark_erup',1], ['new_item_193',0.001]],
        '死亡之劍': [['wpn_scimitar',5], ['arm_67',1], ['scroll_weapon',0.5], ['item_pride_scroll_21',2], ['bk_elf_windshot',0.5], ['bk_elf_stormeye',0.5], ['bk_dark_double',0.1]],
        '不幸的幻象眼魔': [['wpn_crystal_dagger',0.5], ['wpn_katana',30], ['wpn_2hsword',30], ['wpn_siruge',1], ['arm_88',0.1], ['arm_69',30], ['arm_59',3], ['amr_plate',30], ['arm_99',0.1], ['amu_int',0.1], ['acc_128',5], ['acc_130',1], ['shd_phantom_eye',0.01], ['scroll_weapon',30], ['scroll_armor',30], ['bk_vampire',5], ['bk_mana_drain',5], ['bk_dark_shadow',5], ['bk_weaken',5], ['bk_disease',5], ['bk_dark_crit',5], ['item_pride_scroll_21',30], ['item_pride_sealed_21',1]],
        // ===== 🗼 傲慢之塔 21~30 樓 =====
        '恐怖的火炎蛋': [['item_pride_scroll_31',2], ['bk_haste_spell',0.2], ['bk_blaze',0.3], ['scroll_weapon',0.3], ['scroll_armor',0.6], ['bk_fire_prison',0.02]],
        '恐怖夢魘': [['clk_dark',0.5], ['item_pride_scroll_31',2], ['bk_vampire',0.3], ['bk_dark_shadow',0.3], ['bk_weaken',0.3], ['bk_disease',0.3], ['bk_elf_triple',0.05], ['new_item_193',0.001]],
        '恐怖的地獄犬': [['wpn_witchwand',3], ['new_item_158',0.5], ['item_pride_scroll_31',2], ['bk_holy_barrier',0.1], ['bk_dark_crit',0.5], ['new_item_192',0.001], ['bk_fire_prison',0.02], ['bk_elf_energyboost',0.5]],
        '小惡魔': [['scroll_acc',0.001],['amr_demon',0.01], ['amu_str',0.01], ['amu_int',0.01], ['rng_fire',0.01], ['scroll_armor',2], ['scroll_weapon',0.5], ['item_pride_scroll_31',2], ['bk_elf_magicerase',0.01], ['bk_dark_crit',0.5], ['new_item_192',0.001], ['bk_fire_prison',0.01], ['mat_black_blood', 1]],
        '恐怖的伊弗利特': [['item_pride_scroll_31',2], ['bk_fireball',1], ['bk_dex_up',1], ['bk_str_up',1], ['bk_cancel',1], ['bk_blaze',1], ['bk_fire_storm',0.05], ['bk_elf_seal',0.05], ['bk_elf_firewpn',1], ['bk_elf_dancefire',1], ['bk_elf_blazewpn',0.2], ['bk_dark_double',0.1]],
        '恐怖的吸血鬼': [['wpn_crystal_dagger',0.5], ['wpn_katana',30], ['wpn_siruge',1], ['wpn_strwand',2], ['arm_87',30], ['clk_silver_light',1], ['arm_88',0.1], ['arm_69',30], ['arm_59',3], ['amu_int',0.3], ['acc_117',0.1], ['acc_summon_ctrl',0.1], ['rng_water',0.1], ['rng_earth',0.5], ['rng_wind',0.1], ['rng_fire',0.1], ['acc_128',5], ['acc_130',1], ['clk_marcus',0.01], ['new_item_151',30], ['new_item_160',30], ['new_item_152',30], ['new_item_161',30], ['new_item_153',1], ['new_item_162',10], ['scroll_weapon',30], ['scroll_armor',30], ['bk_vampire',5], ['bk_magic_shield',5], ['bk_mana_drain',5], ['bk_dark_shadow',5], ['bk_zombie',5], ['bk_weaken',5], ['bk_summon',1], ['bk_disease',5], ['bk_resurrection',5], ['bk_dark_crit',5], ['item_pride_scroll_31',30], ['item_pride_sealed_31',1], ['scroll_attr_earth', 1.8]],
        // ===== 🗼 傲慢之塔 31~40 樓 =====
        '殘暴的骷髏斧兵': [['wpn_berserker',1], ['scroll_weapon',1], ['scroll_armor',2], ['item_pride_scroll_41',2], ['bk_str_up',0.3]],
        '殘暴的食屍鬼': [['scroll_armor',2], ['item_pride_scroll_41',2], ['bk_berserk',0.3], ['bk_dark_fang',0.1], ['new_item_191',0.001]],
        '殘暴的骷髏槍兵': [['scroll_armor',2], ['item_pride_scroll_41',2], ['bk_dex_up',0.5], ['bk_blaze',0.5], ['new_item_193',0.001]],
        '殘暴的史巴托': [['scroll_acc',0.001],['hlm_mr',0.3], ['scroll_armor',3], ['item_pride_scroll_41',2], ['bk_dark_erup',1]],
        '殘暴的骷髏神射手': [['scroll_weapon',2], ['item_pride_scroll_41',2], ['bk_dex_up',1], ['bk_charm',0.8], ['bk_blaze',0.5], ['bk_elf_windshot',1], ['bk_dark_fang',0.1]],
        '死亡的殭屍王': [['blt_mr',1],['wpn_2hsword',30], ['wpn_siruge',5], ['wpn_dual_abyss',0.05], ['arm_69',30], ['arm_59',3], ['amr_plate',30], ['acc_summon_ctrl',0.1], ['rng_water',0.2], ['rng_earth',0.5], ['rng_wind',0.2], ['rng_fire',0.1], ['acc_128',1], ['acc_130',1], ['scroll_weapon',30], ['scroll_armor',30], ['bk_dark_shadow',5], ['bk_zombie',5], ['bk_weaken',5], ['bk_disease',5], ['bk_resurrection',5], ['bk_seal',5], ['bk_dark_fang',5], ['item_pride_scroll_41',30], ['item_pride_sealed_41',1]],
        '殘暴的骷髏鬥士': [['amr_bone',2], ['scroll_weapon',2], ['item_pride_scroll_41',2], ['bk_dex_up',1], ['bk_haste_spell',0.5], ['bk_dark_double',0.1], ['bk_dark_erup',1]],
        // ===== 🗼 傲慢之塔 41~50 樓 =====
        '幼龍': [['item_dragon_heart',0.01], ['new_item_151',5], ['new_item_157',5], ['new_item_160',5], ['new_item_154',5], ['new_item_152',0.5], ['new_item_158',0.5], ['new_item_161',0.3], ['new_item_155',0.5], ['new_item_153',0.3], ['new_item_159',0.5], ['new_item_162',0.5], ['new_item_156',0.5], ['scroll_armor',1], ['item_pride_scroll_51',2.5], ['bk_fire_prison',0.05], ['wpn_qigu_resonance',0.01]],
        '火焰之靈魂(紅)': [['scroll_armor',0.5], ['item_pride_scroll_51',2]],
        '火焰之靈魂(藍)': [['item_pride_scroll_51',2]],
        '恐怖的鋼鐵高崙': [['mat_golem_heart',1],['scroll_acc',0.001],['arm_99',0.005], ['rng_earth',0.01], ['item_pride_scroll_51',2], ['bk_dark_fang',0.1], ['new_item_180',100], ['new_item_164',20], ['bk_elf_physboost',0.5], ['mat_steel_chunk',10]],
        '火焰之魔法師': [['amu_str',0.01], ['acc_119',0.01], ['acc_125',0.01], ['acc_117',0.01], ['acc_summon_ctrl',0.01], ['scroll_weapon',0.4], ['scroll_armor',1], ['item_pride_scroll_51',2], ['bk_dark_crit',0.5]],
        '骨龍': [['scroll_acc',0.001],['acc_summon_ctrl',0.01], ['new_item_151',5], ['new_item_157',5], ['new_item_160',5], ['new_item_154',5], ['new_item_152',0.8], ['new_item_158',1], ['new_item_161',0.5], ['new_item_155',0.5], ['new_item_153',0.5], ['new_item_159',0.6], ['new_item_162',0.8], ['new_item_156',0.8], ['item_pride_scroll_51',2.5], ['bk_resurrection',0.25], ['bk_dark_crit',0.5], ['scroll_weapon',0.5], ['scroll_armor',1]],
        '地獄的黑豹': [['acc_124',1],['wpn_claw_abyss',0.05], ['amu_str',3], ['acc_128',5], ['blt_body',1], ['scroll_weapon',30], ['scroll_armor',30], ['item_pride_scroll_51',30], ['item_pride_sealed_51',1], ['wpn_dual_destroy',0.5], ['wpn_claw_destroy',0.5], ['wpn_pagrio_wrath',0.01]],
        // ===== 🗼 傲慢之塔 51~60 樓 =====
        '受詛咒的妖魔殭屍': [['bk_berserk',0.2], ['item_pride_scroll_61',2], ['mat_steel_chunk',10]],
        '受詛咒的艾爾摩士兵': [['acc_demonbane',0.03], ['bk_berserk',0.3], ['item_pride_scroll_61',2]],
        '受詛咒的艾爾摩法師': [['scroll_acc',0.001],['acc_demonbane',0.03], ['item_pride_scroll_61',2], ['wpn_qigu_meditate',0.01]],
        '受詛咒的艾爾摩將軍': [['acc_demonbane',0.03], ['bk_shock_stun',0.02], ['bk_reduction_armor',0.1], ['bk_spike_armor',0.01], ['item_pride_scroll_61',2]],
        '不死的木乃伊王': [['hlm_mummy_crown',0.1], ['rng_water',0.2], ['rng_earth',1], ['rng_wind',0.3], ['rng_fire',0.1], ['scroll_weapon',30], ['scroll_armor',30], ['bk_sleep_mist',0.2], ['bk_elf_groundtrap',5], ['bk_elf_earthshield',3], ['bk_elf_steelguard',1], ['item_pride_scroll_61',30], ['item_pride_sealed_61',1], ['wpn_mapler_punish',0.01]],
        // ===== 🗼 傲慢之塔 61~70 樓 =====
        '暗黑萊肯': [['new_item_159',0.5], ['item_pride_scroll_71',2]],
        '冷酷冰原老虎': [['scroll_acc',0.001],['scroll_weapon',1], ['scroll_armor',1], ['item_pride_scroll_71',2]],
        '火焰烈炎獸': [['amr_plate',1], ['scroll_weapon',1], ['scroll_armor',1], ['bk_blaze',0.5], ['bk_dark_crit',0.5], ['item_pride_scroll_71',2], ['new_item_192',0.001]],
        '火焰阿西塔基奧': [['wpn_2hsword',1], ['amu_cha',0.05], ['scroll_weapon',1], ['scroll_armor',1], ['bk_earthquake',0.5], ['bk_summon',0.1], ['bk_quake',1], ['item_pride_scroll_71',2], ['new_item_192',0.001]],
        '冷酷的艾莉絲': [['arm_99',1], ['amu_iris',0.1], ['amu_str',3], ['acc_128',5], ['acc_130',1], ['new_item_157',30], ['new_item_158',30], ['new_item_159',10], ['scroll_weapon',30], ['scroll_armor',30], ['bk_full_heal',5], ['bk_thunder_storm',1], ['bk_blizzard',1], ['item_pride_scroll_71',30], ['item_pride_sealed_71',1], ['bk_blizzard_storm',1]],
        // ===== 🗼 傲慢之塔 71~80 樓 =====
        '暗黑黑騎士': [['acc_doro',0.1], ['item_pride_scroll_81',2], ['bk_reduction_armor',0.1], ['bk_spike_armor',0.01], ['mat_steel_chunk',10]],
        '暗黑火焰戰士': [['new_item_139',1], ['scroll_armor',1], ['item_pride_scroll_81',1], ['bk_reduction_armor',0.1], ['bk_spike_armor',0.01]],
        '暗黑火焰弓箭手': [['new_item_139',1], ['scroll_armor',1], ['item_pride_scroll_81',1], ['bk_reduction_armor',0.1], ['bk_elf_triple',0.05]],
        '暗黑思克巴女皇': [['scroll_acc',0.001],['acc_summon_ctrl',0.01], ['acc_127',0.5], ['acc_129',1], ['blt_body',0.05], ['acc_131',0.05], ['new_item_158',1], ['item_pride_scroll_81',1], ['bk_elf_winddash',5], ['bk_elf_stormeye',1], ['bk_elf_stormshot',0.1], ['bk_elf_physboost',0.5]],
        '闇黑的騎士范德': [['acc_138',1],['wpn_siruge',5], ['wpn_vander_sword',0.1], ['arm_99',1.5], ['acc_summon_ctrl',0.1], ['scroll_weapon',30], ['scroll_armor',30], ['bk_shock_stun',1], ['bk_reduction_armor',5], ['bk_holy_barrier',3], ['bk_counter_barrier',0.1], ['item_pride_scroll_81',30], ['item_pride_sealed_81',1]],
        // ===== 🗼 傲慢之塔 81~90 樓 =====
        '傲慢的潔尼斯女王': [['acc_jenis_ring',0.001], ['item_pride_scroll_91',0.5], ['scroll_weapon',1], ['scroll_armor',2]],
        '小幻象眼魔': [['scroll_acc',0.001],['item_pride_scroll_91',0.5], ['bk_abs_barrier',0.01], ['scroll_weapon',1], ['scroll_armor',3]],
        '馬昆斯吸血鬼': [['item_pride_scroll_91',0.5], ['bk_vampire',5], ['bk_soul_up',0.02], ['scroll_weapon',1], ['scroll_armor',2]],
        '恐怖的殭屍王': [['arm_99',0.01], ['item_pride_scroll_91',0.5], ['bk_zombie',1], ['scroll_armor',2]],
        '不滅的巫妖': [['wpn_katana',30], ['wpn_2hsword',30], ['wpn_siruge',5], ['wpn_strwand',5], ['clk_silver_light',1], ['arm_88',0.2], ['clk_lich',0.1], ['arm_69',30], ['arm_59',3], ['arm_60',30], ['amr_plate',30], ['arm_99',1], ['amu_int',1], ['acc_117',0.5], ['acc_summon_ctrl',0.3], ['rng_water',1], ['rng_earth',1], ['rng_wind',1], ['rng_fire',1], ['acc_128',10], ['acc_130',2], ['scroll_weapon',30], ['scroll_armor',30], ['bk_dark_shadow',10], ['bk_weaken',5], ['bk_disease',5], ['bk_resurrection',5], ['bk_seal',5], ['bk_elf_mirror',1], ['item_pride_scroll_91',30], ['item_pride_sealed_91',1]],
        // ===== 🗼 傲慢之塔 91~100 樓 =====
        '土精靈王': [['rng_earth',0.05], ['acc_130',0.5], ['scroll_weapon',1], ['scroll_attr_earth', 0.18]],
        '水精靈王': [['arm_69',5], ['rng_water',0.01], ['acc_130',0.5], ['scroll_armor',1], ['scroll_attr_water', 0.18]],
        '風精靈王': [['arm_69',5], ['rng_wind',0.05], ['acc_130',0.5], ['scroll_armor',1], ['scroll_attr_wind', 0.18], ['wpn_thunder_sword',0.05]],   // 🆕 雷雨之劍 0.05%
        '火精靈王': [['rng_fire',0.01], ['acc_130',0.5], ['scroll_weapon',1], ['scroll_armor',1], ['scroll_attr_fire', 0.18]],
        '艾莉絲': [['scroll_acc',0.001],['arm_99',0.01], ['amu_str',0.1], ['scroll_weapon',1]],
        '木乃伊王': [['rng_water',0.1], ['rng_earth',0.5], ['rng_wind',0.3], ['rng_fire',0.05], ['bk_sleep_mist',0.2], ['bk_elf_mirror',1], ['scroll_weapon',1], ['scroll_armor',1]],
        '騎士范德': [['wpn_siruge',0.1], ['arm_99',0.01], ['acc_summon_ctrl',0.01], ['bk_shock_stun',0.1], ['bk_resurrection',1]],
        '邪惡的鐮刀死神': [['scroll_acc',0.1],['wpn_katana',30], ['wpn_siruge',10], ['wpn_dual_abyss',0.1], ['wpn_claw_abyss',0.1], ['wpn_xbow_abyss',0.05], ['clk_silver_light',2], ['arm_88',0.5], ['arm_59',3], ['arm_99',3], ['acc_117',1], ['acc_summon_ctrl',0.5], ['rng_water',5], ['rng_earth',5], ['rng_wind',5], ['rng_fire',5], ['acc_128',10], ['acc_130',2], ['glv_reaper',10], ['scroll_weapon',100], ['scroll_armor',100], ['bk_summon',5], ['bk_resurrection',5], ['bk_disintegrate',1], ['item_pride_sealed_11',1], ['item_pride_sealed_21',1], ['item_pride_sealed_31',1], ['item_pride_sealed_41',1], ['item_pride_sealed_51',1], ['item_pride_sealed_61',1], ['item_pride_sealed_71',1], ['item_pride_sealed_81',1], ['item_pride_sealed_91',1]],
        // ===== 🏝️ 遺忘之島：怪物掉落 =====
        '遺忘之島鱷魚': [['arm_95',0.1]],
        '遺忘之島狼人': [['item_forgotten_scale',1]],
        '遺忘之島夏洛伯': [['item_forgotten_scale',1], ['bk_sleep_mist',0.2]],
        '遺忘之島亞力安': [['item_forgotten_sword',0.1], ['item_forgotten_plate',1], ['glv_dk',0.1], ['acc_demonbane',0.1], ['item_ancient_scroll',0.01]],
        '遺忘之島黑暗精靈': [['hlm_wind',0.1], ['item_forgotten_leather',1], ['rng_mr',0.3], ['hlm_darkelf',0.1], ['mat_black_mithril',0.1]],
        '遺忘之島歐熊': [['item_forgotten_leather',1]],
        '遺忘之島蜥蜴人': [['item_forgotten_robe',1]],
        '遺忘之島卡司特': [['item_forgotten_leather',1], ['new_item_191',0.001]],
        '遺忘之島蛇女': [['item_forgotten_robe',1], ['item_forgotten_scale',1], ['arm_95',0.1], ['new_item_221',3]],
        '遺忘之島萊肯': [['hlm_wind',0.1], ['item_forgotten_leather',1], ['rng_mr',0.3]],
        '遺忘之島巨斧牛人': [['item_forgotten_scale',1], ['rng_mr',0.3], ['item_ancient_scroll',0.005], ['new_item_191',0.001]],
        '遺忘之島食人妖精': [['item_forgotten_robe',1], ['acc_demonbane',0.1]],
        '遺忘之島楊果里恩': [['item_forgotten_leather',1], ['rng_mr',0.3]],
        '遺忘之島格利芬': [['item_forgotten_xbow',0.1], ['hlm_wind',0.1], ['item_forgotten_robe',1], ['acc_demonbane',0.1], ['new_item_193',0.002], ['mat_griffon_feather',2]],
        '遺忘之島鏈鎚牛人': [['item_forgotten_plate',1], ['rng_mr',0.3], ['item_ancient_scroll',0.005], ['new_item_191',0.001]],
        '遺忘之島哈維': [['arm_95',0.1], ['rng_harpy',0.02]],
        '遺忘之島變形怪': [['acc_demonbane',0.1], ['item_ancient_scroll',0.005]],
        '遺忘之島巨大鱷魚': [['item_forgotten_plate',1], ['arm_95',0.1], ['rng_mr',0.3]],
        '遺忘之島卡司特王': [['item_forgotten_leather',1], ['rng_mr',0.3]],
        '遺忘之島多羅': [['item_forgotten_scale',1], ['acc_132',0.3]],
        '遺忘之島阿魯巴': [['item_forgotten_greatsword',0.1], ['item_forgotten_scale',1], ['acc_demonbane',0.1]],
        '遺忘之島食人妖精王': [['item_forgotten_plate',1], ['rng_mr',0.3], ['new_item_192',0.001]],
        '遺忘之島邪惡蜥蜴': [['item_forgotten_sword',0.1], ['item_forgotten_robe',1], ['glv_demon',0.1], ['acc_demonbane',0.1], ['item_ancient_scroll',0.01]],
        '遺忘之島獨眼巨人': [['item_forgotten_greatsword',0.1], ['item_forgotten_plate',1], ['acc_demonbane',0.1]],
        '遺忘之島飛龍': [['item_forgotten_xbow',0.1], ['hlm_wind',0.5], ['item_forgotten_leather',1], ['glv_demon',0.1], ['glv_dk',0.3], ['acc_demonbane',0.2], ['rng_mr',1], ['new_item_192',0.001], ['item_ancient_scroll',0.02], ['item_wyvern_blood',5]],
        '遺忘之島巨大牛人': [['wpn_katana',30], ['wpn_greatsword',1], ['item_unknown_spear',0.1], ['wpn_taurus_axe',0.5], ['amr_plate',30], ['glv_glove',30], ['amu_str',2], ['acc_127',5], ['blt_body',1], ['new_item_157',30], ['new_item_158',30], ['new_item_159',10], ['scroll_weapon',30], ['scroll_armor',30], ['item_ancient_scroll',0.5], ['bk_bless_wpn',5], ['bk_berserk',5], ['bk_full_heal',5], ['bk_elf_blazewpn',5], ['bk_elf_stormshot',1], ['scroll_attr_earth', 1.8]],
        // ===== 🏛️ 隱藏狩獵區域（象牙塔系列）怪物掉落 =====
        '象牙塔石頭高崙': [['mat_golem_heart',0.1],['wpn_berserker',0.5],['new_item_151',1],['mem_golem',0.2]],
        '象牙塔鋼鐵高崙': [['new_item_191',0.001],['new_item_180',100],['new_item_151',1],['mem_golem',0.2], ['mat_steel_chunk',10]],
        '象牙塔活鎧甲': [['new_item_154',1],['bk_holy_barrier',0.03],['new_item_193',0.001], ['mat_moonlight_breath', 0.05]],
        '象牙塔密密': [['wpn_33',1],['wpn_katana',0.3],['wpn_2hsword',1],['wpn_demon_sword',0.001],['wpn_greatsword',1],['wpn_demon_dual',0.01],['wpn_demon_claw',0.01],['wpn_demon_xbow',0.01],['arm_62',1],['arm_69',0.3],['arm_61',5],['arm_59',0.1],['amr_plate',2],['glv_demon',0.1],['bot_demon',0.1],['scroll_weapon',2],['scroll_armor',2],['bk_mummy_curse',3],['bk_holy_dash',1],['bk_invisible',0.1],['bk_meteor',0.01],['bk_abs_barrier',0.1],['bk_soul_up',0.1],['bk_elf_soul',1],['bk_elf_preciseshot',0.01]],
        '象牙塔長者': [['wpn_38',3],['acc_117',0.005],['acc_125',0.01],['acc_119',0.01]],
        '象牙塔黑長者': [['wpn_witchwand',10],['acc_117',0.005],['acc_125',0.01],['acc_119',0.01],['arm_84',0.001],['arm_96',0.001]],
        '象牙塔奇美拉': [['bk_dark_poison',2],['mat_chimera_dragon',10],['mat_chimera_goat',10],['mat_chimera_lion',10],['mat_chimera_snake',10]],
        '象牙塔蛇女': [['acc_131',0.1],['scroll_weapon',0.5],['bk_weaken',0.5],['new_item_221',3]],
        '象牙塔黑魔法師': [['acc_demonbane',0.05],['scroll_weapon',0.5]],
        '象牙塔死神': [['glv_reaper',0.01],['scroll_armor',0.5],['scroll_weapon',0.5],['new_item_193',0.0001], ['mat_moonlight_breath', 0.05], ['wpn_blackflame_sword',0.1]],   // 🆕 黑燄之劍 0.1%
        '象牙塔閃電球': [['bk_holy_dash',0.1]],   // 🆕 神聖疾走 0.1%（原無掉落表·新建）
        '象牙塔影魔': [['bk_dark_shadow',0.5]],
        '象牙塔巴列斯之影': [['mat_black_mithril',1],['wpn_powerless_baless',0.0001],['bot_baless',0.0001]],
        '卡魯塔': [['acc_129',1],['acc_131',1],['new_item_151',10],['new_item_157',10],['new_item_160',10],['new_item_154',10],['new_item_152',5],['new_item_158',5],['new_item_161',5],['new_item_155',5],['new_item_153',0.5],['new_item_159',1],['new_item_162',1],['new_item_156',1],['scroll_armor',10],['scroll_weapon',10],['bk_thunder',5],['bk_tornado',1],['bk_greater_haste',2],['bk_blizzard',1],['bk_elf_windshot',10]],
        '哈汀之影': [['wpn_33',1],['wpn_katana',0.3],['new_item_151',10],['wpn_2hsword',0.5],['wpn_siruge',0.1],['wpn_demon_sword',0.02],['wpn_greatsword',1],['wpn_demon_dual',0.01],['wpn_demon_claw',0.01],['wpn_demon_xbow',0.01],['arm_62',0.3],['arm_69',1],['arm_61',1],['arm_59',0.3],['amr_plate',1],['item_hatin_diary',1],['scroll_armor',3],['scroll_weapon',3]],
        '象牙塔炎魔的奴隸': [['mat_black_mithril',1]],
        '象牙塔小惡魔': [['wpn_demon_axe',0.01],['mat_black_mithril',1]],
        '象牙塔巴風特之影': [['mat_black_mithril',1],['wpn_powerless_baphomet',0.0001],['amr_baphomet',0.0001]],
        '象牙塔翼魔': [['mat_black_mithril',1]],
        '象牙塔炎魔之影': [['mat_black_mithril',1], ['mat_black_blood',1]],   // 🩹 v3.1.79 稽核修：原孤兒 key「炎魔之影」（無此怪名·永不觸發）的黑色血痕掉落併入此表
        '象牙塔惡魔之影': [['mat_black_mithril',1],['wpn_demon_axe',0.1],['wpn_demon_scythe',0.0001],['wpn_demon_dual',0.01],['wpn_demon_claw',0.01],['wpn_demon_xbow',0.01]],
        // ===== 🐜 螞蟻洞窟 新增怪物掉落 + 巨蟻女皇（古代妖精裝備） =====
        '白螞蟻群': [['wpn_giantaxe',0.1],['arm_46',0.03],['arm_108',0.3],['new_item_154',5],['bk_elf_groundtrap',0.2],['bk_elf_earthbless',0.1]],
        '巨大白螞蟻': [['wpn_giantaxe',0.1],['arm_61',0.1],['arm_108',0.5],['new_item_158',0.2],['bk_elf_groundtrap',0.2]],
        '強化巨蟻': [['arm_47',0.03],['arm_60',0.1],['new_item_154',5],['new_item_158',0.2]],
        '強化白螞蟻群': [['arm_46',0.03],['arm_60',0.2],['arm_108',0.5],['new_item_155',0.3],['bk_elf_groundtrap',0.2],['bk_elf_steelguard',0.05]],
        '巨大突擊螞蟻': [['wpn_greatsword',0.1],['arm_46',0.03],['arm_61',0.5],['new_item_155',0.6],['bk_elf_earthbless',0.2],['bk_elf_steelguard',0.1]],
        '巨大強化白螞蟻': [['wpn_2hsword',0.05],['wpn_greatsword',0.1],['arm_46',0.05],['arm_61',0.5],['arm_60',0.3],['arm_108',0.6],['new_item_158',0.3],['new_item_155',0.6],['bk_elf_earthbless',0.2],['bk_elf_groundtrap',0.2]],
        '巨大守護螞蟻': [['wpn_ancient_darkelf_sword',0.001],['wpn_ancient_elf_xbow',0.001],['arm_108',0.6],['bk_elf_groundtrap',0.3]],
    };

    // 🏺 遺物掉落（各為單一怪物專屬·極低機率）。用 push 併入既有掉落陣列（避免同名 key 覆蓋 footgun）；無既有掉落者自動新建陣列。
    [
        ['妖魔', 'relic_orc_lid', 0.0001],
        ['哥布林', 'relic_goblin_blade', 0.0001],
        ['妖魔弓箭手', 'relic_orcarcher_bow', 0.0001],
        ['地靈', 'relic_gremlin_club', 0.0001],
        ['蘑菇', 'relic_mushroom_cap', 0.0001],
        ['污染的地精靈', 'relic_gnomeearth_tshirt', 0.0001],
        ['狼', 'relic_wolf_shawl', 0.0001],
        ['哈士奇', 'relic_husky_bone', 0.0001],
        ['侏儒', 'relic_dwarf_sheet', 0.0001],
        ['熊', 'relic_bear_fishbone', 0.0001],
        ['牧羊犬', 'relic_shepherd_boots', 0.0001],
        ['人形殭屍', 'relic_zombie_shin', 0.0001],
        ['杜賓狗', 'relic_doberman_fang', 0.0001],
        ['安普長老', 'relic_amp_staff', 0.0001],
        ['污染的安特', 'relic_ent_bark', 0.0001],
        ['漂浮之眼', 'relic_eye_crystal', 0.0001],
        ['妖魔鬥士', 'relic_gladiator_scimitar', 0.0001],
        ['冰原狼人', 'relic_icefield_pick', 0.0001],
        ['怪手', 'relic_monsterhand_skin', 0.0001],
        ['狼人', 'relic_werewolf_mace', 0.0001],
        ['侏儒戰士', 'relic_dwarf_chainmail', 0.0001],
        ['骷髏', 'relic_weathered_skull', 0.0001],
        ['妖魔殭屍', 'relic_orc_nail', 0.0001],
        ['甘地妖魔', 'relic_orc_gloves', 0.0001],
        ['污染的潘', 'relic_pan_staff', 0.0001],
        ['鱷魚', 'relic_croc_tshirt', 0.0001],
        ['冰之女王侍女', 'relic_maid_gift', 0.0001],
        ['巨蟻', 'relic_giantant_antenna', 0.0001],
        ['妖魔法師', 'relic_orcmage_cloth', 0.0001],
        ['骷髏弓箭手', 'relic_elastic_rib', 0.0001],
        ['蟑螂人', 'relic_roach_shell', 0.0001],
        ['石頭高崙', 'relic_golem_fist', 0.0001],
        ['羅孚妖魔', 'relic_orc_cleaver', 0.0001],
        ['骷髏斧手', 'relic_strong_femur', 0.0001],
        ['骷髏斧手', 'relic_forgotten_spear', 0.0001],
        ['夏洛伯', 'relic_spider_claw', 0.0001],
        ['妖魔巡守', 'relic_scout_scope', 0.0001],
        ['哈柏哥布林', 'relic_hobgoblin_grinder', 0.0001],
        ['阿吐巴妖魔', 'relic_orc_butcher', 0.0001],
        ['都達瑪拉妖魔', 'relic_orc_pole', 0.0001],
        ['歐熊', 'relic_bear_fur', 0.0001],
        ['蜥蜴人', 'relic_lizard_shield', 0.0001],
        ['穴居人', 'relic_caveman_webbing', 0.0001],
        ['史巴托', 'relic_sparta_grudge', 0.0001],
        ['食屍鬼', 'relic_ghoul_bracelet', 0.0001],
        ['鯊魚', 'relic_shark_teeth', 0.0001],
        ['黑騎士', 'relic_guard_towershield', 0.0001],
        // 🏺 遺物 第二批（v3.1.1·29 件）
        ['黑騎士搜索隊', 'relic_guard_spear', 0.0001],
        ['人魚', 'relic_mermaid_tear', 0.0001],
        ['那魯加妖魔', 'relic_orc_loincloth', 0.0001],
        ['萊肯', 'relic_crescent_earring', 0.0001],
        ['楊果里恩', 'relic_ungoliant_plate', 0.0001],
        ['蟹人', 'relic_crab_claw', 0.0001],
        ['狂野之毒', 'relic_wild_mane_coat', 0.0001],
        ['狂野毒牙', 'relic_venom_fang', 0.0001],
        ['歐姆', 'relic_ohm_shackle', 0.0001],
        ['巨大兵蟻', 'relic_soldierant_carapace', 0.0001],
        ['鼠人', 'relic_ratman_skewer', 0.0001],
        ['海星', 'relic_starfish_arm', 0.0001],
        ['遺忘之島鱷魚', 'relic_croc_soul', 0.0001],
        ['遺忘之島蜥蜴人', 'relic_lizard_scale', 0.0001],
        ['狂暴蜥蜴人', 'relic_veteran_lizard_gauntlet', 0.0001],
        ['狂野之魔', 'relic_black_gale', 0.0001],
        ['長老', 'relic_elder_thunder', 0.0001],
        ['卡司特', 'relic_green_imp_nail', 0.0001],
        ['狂暴的歐姆', 'relic_ohm_hidepants', 0.0001],
        ['食人妖精', 'relic_ogre_mawashi', 0.0001],
        ['蛇女', 'relic_lamia_tailscale', 0.0001],
        ['魔蝙蝠', 'relic_bat_wing', 0.0001],
        ['底比斯 曼陀羅草(白)', 'relic_mandra_spirit', 0.0001],
        ['歐姆裝甲兵', 'relic_ohm_heavyarmor', 0.0001],
        ['地獄犬', 'relic_cerberus_wand', 0.0001],
        ['希爾黛斯', 'relic_watersprite_string', 0.0001],
        ['龍龜', 'relic_dragonturtle_shell', 0.0001],
        ['藍尾蜥蜴', 'relic_bluetail_tail', 0.0001],
        ['重裝蜥蜴人', 'relic_lizardman_cleaver', 0.0001],
        // 🏺 遺物 第三批（v3.1.2·19 件）
        ['狂暴的歐姆裝甲兵', 'relic_ohm_maul', 0.0001],
        ['闇之精靈', 'relic_darkspirit_shroud', 0.0001],
        ['犰狳', 'relic_armadillo_helm', 0.0001],
        ['白螞蟻群', 'relic_whiteant_shell', 0.0001],
        ['高等蜥蜴人', 'relic_high_lizard_armguard', 0.0001],
        ['奇異鸚鵡', 'relic_parrot_beak', 0.0001],
        ['海賊骷髏', 'relic_pirate_scimitar', 0.0001],
        ['毒蠍', 'relic_scorpion_sting', 0.0001],
        ['哈維', 'relic_harvey_claw', 0.0001],
        ['底比斯 曼陀羅草', 'relic_death_leaf', 0.0001],
        ['黑暗妖精魔法學徒', 'relic_apprentice_wand', 0.0001],
        ['魔熊', 'relic_bear_vitality', 0.0001],
        ['歐姆民兵', 'relic_militia_armor', 0.0001],
        ['骷髏神射手', 'relic_sharpshooter_bow', 0.0001],
        ['骷髏警衛', 'relic_guard_pike', 0.0001],
        ['黑暗精靈', 'relic_whirlwind_xbow', 0.0001],
        ['黑暗妖精殘兵(弓)', 'relic_darkremnant_boots', 0.0001],
        ['歐吉', 'relic_ogi_greataxe', 0.0001],
        ['多羅', 'relic_doro_vitality', 0.0001],
        // 🏺 遺物 第四批（v3.1.4）
        ['伊萊克頓', 'relic_deepfish_skin', 0.0001],
        ['強盜', 'relic_bandit_token', 0.0001],
        ['雪人', 'relic_yeti_fist', 0.0001],
        ['雪人', 'arm_yeti_gloves', 0.01],   // 一般防具 雪人手套（非遺物·0.01%）
        ['紙人', 'relic_paper_cloak', 0.0001],
        ['黑暗妖精盜賊', 'relic_darkthief_claw', 0.0001],
        ['闇精靈王', 'relic_darkelf_chainsword', 0.0001],
        ['海賊骷髏士兵', 'relic_seawater_shirt', 0.0001],
        ['骷髏鬥士', 'relic_fighter_axe', 0.0001],
        ['奎斯坦修', 'relic_hermitcrab_shell', 0.0001],
        ['爆彈花', 'relic_bombflower_core', 0.0001],
        ['底比斯 聖甲蟲', 'relic_scarab_shin', 0.0001],
        ['黑暗妖精殘兵(劍)', 'relic_darkelf_grindblade', 0.0001],
        ['黑暗妖精殘兵(十字弓)', 'relic_darkelf_shootglove', 0.0001],
        ['巨人', 'relic_giant_clubfrag', 0.0001],
        ['食人妖精王', 'relic_ogreking_collar', 0.0001],
        ['莫妮亞', 'relic_monia_sandals', 0.0001],
        ['艾爾摩士兵', 'relic_wornout_underwear', 0.0001],
        ['夢幻之島蘑菇', 'relic_dream_mushroom_soul', 0.0001],
        // 🏺 遺物 第六批（v3.1.13·11 件）
        ['夢幻之島鬼火', 'relic_wisp_remnant', 0.0001],
        ['冰人', 'relic_frostdeath_breath', 0.0001],
        ['黑暗妖精殘兵(法師)', 'relic_remnant_barrier', 0.0001],
        ['喚獸師', 'relic_summoner_whip', 0.0001],
        ['金屬蜈蚣', 'relic_metalshell_shin', 0.0001],
        ['格利芬', 'relic_griffin_claw', 0.0001],
        ['艾爾摩法師', 'relic_wither_amulet', 0.0001],
        ['密密', 'relic_stalker_chest', 0.0001],
        ['強化巨蟻', 'relic_giantant_eye', 0.0001],
        ['巨大鱷魚', 'relic_croc_fang', 0.0001],
        ['冰石高崙', 'relic_icestone_maul', 0.0001],
        ['底比斯 聖甲蟲(藍)', 'relic_scarab_nest', 0.0001],   // 🏺 v3.1.16：聖甲蟲的孵育巢（aggroHide 迴避仇恨盾）
        // 🏺 遺物 第七批（v3.1.18·17 件）
        ['黑法師', 'relic_blackmage_pants', 0.0001],
        ['變種蛇女', 'relic_mutant_lamia_scale', 0.0001],
        ['海賊骷髏刀手', 'relic_pirate_bandana', 0.0001],
        ['海賊骷髏首領', 'relic_pirate_ring', 0.0001],
        ['巨人戰士', 'relic_giant_toothpick', 0.0001],
        ['巨人長老', 'relic_giant_throwstone', 0.0001],
        ['卡司特王', 'relic_redimp_nail', 0.0001],
        ['活鎧甲', 'relic_armor_spareblade', 0.0001],
        ['多眼怪', 'relic_beholder_gaze', 0.0001],
        ['龍蠅', 'relic_fly_curse', 0.0001],
        ['冰原老虎', 'relic_whitetiger_coat', 0.0001],
        ['雪怪', 'relic_yeti_foot', 0.0001],
        ['變形怪', 'relic_shapeshifter_underwear', 0.0001],
        ['黑暗妖精殘兵(雙手劍)', 'relic_veteran_greatsword', 0.0001],
        ['變種楊果里恩', 'relic_thorn_needle', 0.0001],
        ['黑暗棲林者', 'relic_thorn_curse', 0.0001],
        ['亞力安', 'relic_cockatrice_gaze', 0.0001],
        // 🏺 遺物 第八批（v3.1.21·3 件）
        ['遺忘之島狼人', 'relic_moonhowl_helm', 0.0001],
        ['遺忘之島夏洛伯', 'relic_poison_vial', 0.0001],
        ['強化白螞蟻群', 'relic_ant_incubessence', 0.0001],
        // 🏺 遺物 第九批（v3.1.28·10 件）
        ['阿魯巴', 'relic_aruba_haste', 0.0001],
        ['火焰戰士', 'relic_ashwarrior_flamesword', 0.0001],
        ['艾爾摩將軍', 'relic_deadgeneral_greatsword', 0.0001],
        ['鋼鐵高崙', 'relic_steel_bulwark', 0.0001],
        ['強盜頭目', 'relic_raider_belt', 0.0001],
        ['底比斯 凱比斯(黑)', 'relic_darkscorpion_pincers', 0.0001],
        ['遺忘之島黑暗精靈', 'relic_forgotten_sniperbow', 0.0001],
        ['遺忘之島歐熊', 'relic_arrowfur_cloak', 0.0001],
        ['邪惡蜥蜴', 'relic_evillizard_eye', 0.0001],
        ['火焰弓箭手', 'relic_flamearcher_bracer', 0.0001],   // 🏺 烈焰射手的護腕：spec 掉落源寫成物品名·取同義同級的 火焰弓箭手(fire_archer)
        // 🏺 遺物 第十批（v3.1.32·5 件）
        ['黑暗妖精警衛(十字弓)', 'relic_modded_crossbow', 0.0001],
        ['梅杜莎', 'relic_medusa_stinger', 0.0001],
        ['遺忘之島卡司特', 'relic_silent_venom', 0.0001],
        ['思克巴', 'relic_charm_heart', 0.0001],
        ['死亡之劍', 'relic_swordsman_underwear', 0.0001],
        // 🏺 遺物 第十一批（v3.1.33·5 件）
        ['恐怖的火炎蛋', 'relic_fireegg_orb', 0.0001],
        ['遺忘之島蛇女', 'relic_venom_avatar', 0.0001],
        ['遺忘之島萊肯', 'relic_lycan_swiftlegs', 0.0001],
        ['遺忘之島巨斧牛人', 'relic_axetaurus_brutalaxe', 0.0001],
        ['遺忘之島食人妖精', 'relic_troll_belly', 0.0001],
        // 🏺 遺物 第五批新增（v3.1.52·19 件）
        ['炎魔的思克巴', 'relic_burning_love', 0.0001],
        ['巨大突擊螞蟻', 'relic_fearless_charge', 0.0001],
        ['火蜥蜴', 'relic_lizard_tongue', 0.0001],
        ['夢幻之島火蜥蜴', 'relic_flame_avatar', 0.0001],
        ['夢幻之島殺人蜂', 'relic_killerbee_sting', 0.0001],
        ['夢幻之島暴走兔', 'relic_runaway_carrot', 0.0001],
        ['夢幻之島冰人', 'relic_frost_avatar', 0.0001],
        ['黑暗妖精巡守', 'relic_handy_quiver', 0.0001],
        ['黑暗妖精士兵', 'relic_soldier_medal', 0.0001],
        ['邪惡密密', 'relic_evilchest_relic', 0.0001],
        ['遺忘之島楊果里恩', 'relic_ancient_spider_claw', 0.0001],
        ['火炎蛋', 'relic_flame_belt', 0.0001],
        ['夢幻之島閃電球', 'relic_thunder_crown', 0.0001],
        ['夢幻之島鎧甲守衛', 'relic_guardian_greatsword', 0.0001],
        ['夢幻之島火炎蛋', 'relic_dream_flamesoul', 0.0001],
        ['夢幻之島冰石高崙', 'relic_frost_stone_shield', 0.0001],
        ['底比斯 凱比斯(紅)', 'relic_redscorpion_ring', 0.0001],
        ['奇美拉', 'relic_cerberus_horn', 0.0001],
        ['邪惡多眼怪', 'relic_lightbeam_wand', 0.0001],
        // 🐍 蛇神降臨·提卡爾：寶箱碎片(初級 上/下·高級 上/下)/時空裂痕碎片 10%/龍騎士書板/祭壇鑰匙 2% + 遺物 0.0001%
        ['提卡爾艾庫阿茲特', 'mat_kukulkan_basic_up', 5], ['提卡爾艾庫阿茲特', 'mat_rift_shard', 10], ['提卡爾艾庫阿茲特', 'bk_dragon_awaken_falion', 0.5], ['提卡爾艾庫阿茲特', 'relic_azt_mirror', 0.0001],
        ['提卡爾艾庫阿茲特(黃)', 'mat_kukulkan_basic_down', 5], ['提卡爾艾庫阿茲特(黃)', 'mat_rift_shard', 10], ['提卡爾艾庫阿茲特(黃)', 'relic_azt_prism', 0.0001],
        ['提卡爾艾庫尤卡(藍)', 'mat_kukulkan_basic_up', 5], ['提卡爾艾庫尤卡(藍)', 'mat_rift_shard', 10], ['提卡爾艾庫尤卡(藍)', 'relic_yuka_blowdart', 0.0001],
        ['提卡爾艾庫尤卡(白)', 'mat_kukulkan_basic_down', 5], ['提卡爾艾庫尤卡(白)', 'mat_rift_shard', 10], ['提卡爾艾庫尤卡(白)', 'relic_yuka_quiver', 0.0001],
        ['提卡爾艾庫卡伊拉(藍)', 'mat_kukulkan_basic_up', 5], ['提卡爾艾庫卡伊拉(藍)', 'bk_dragon_awaken_antares', 0.5], ['提卡爾艾庫卡伊拉(藍)', 'mat_rift_shard', 10], ['提卡爾艾庫卡伊拉(藍)', 'relic_kaira_fang', 0.0001],
        ['提卡爾艾庫卡伊拉(黃)', 'mat_kukulkan_basic_down', 5], ['提卡爾艾庫卡伊拉(黃)', 'bk_dragon_awaken_antares', 0.5], ['提卡爾艾庫卡伊拉(黃)', 'mat_rift_shard', 10], ['提卡爾艾庫卡伊拉(黃)', 'relic_kaira_hood', 0.0001],
        ['提卡爾艾庫巴拉', 'mat_kukulkan_basic_up', 5], ['提卡爾艾庫巴拉', 'mat_rift_shard', 10], ['提卡爾艾庫巴拉', 'relic_bara_wing', 0.0001],
        ['提卡爾艾庫巴拉(紅)', 'mat_kukulkan_basic_down', 5], ['提卡爾艾庫巴拉(紅)', 'mem_cube_quake', 0.5], ['提卡爾艾庫巴拉(紅)', 'mat_rift_shard', 10], ['提卡爾艾庫巴拉(紅)', 'relic_bara_eye', 0.0001],
        ['提卡爾艾庫艾托', 'mat_kukulkan_basic_up', 5], ['提卡爾艾庫艾托', 'bk_dragon_lavabolt', 0.5], ['提卡爾艾庫艾托', 'mat_rift_shard', 10], ['提卡爾艾庫艾托', 'relic_eto_whip', 0.0001],
        ['提卡爾艾庫艾托(枯竭)', 'mat_kukulkan_basic_down', 5], ['提卡爾艾庫艾托(枯竭)', 'bk_dragon_lavabolt', 0.5], ['提卡爾艾庫艾托(枯竭)', 'mat_rift_shard', 10], ['提卡爾艾庫艾托(枯竭)', 'relic_eto_wand', 0.0001],
        ['提卡爾薩德泥偶', 'mat_kukulkan_high_up', 5], ['提卡爾薩德泥偶', 'item_tikal_altar_key', 2], ['提卡爾薩德泥偶', 'mat_rift_shard', 10], ['提卡爾薩德泥偶', 'relic_mud_idol', 0.0001],
        ['提卡爾薩德泥偶(黑)', 'mat_kukulkan_high_down', 5], ['提卡爾薩德泥偶(黑)', 'item_tikal_altar_key', 2], ['提卡爾薩德泥偶(黑)', 'mat_rift_shard', 10], ['提卡爾薩德泥偶(黑)', 'relic_mud_jar', 0.0001],
        ['提卡爾薩德司卡(紫)', 'mat_kukulkan_high_up', 5], ['提卡爾薩德司卡(紫)', 'item_tikal_altar_key', 2], ['提卡爾薩德司卡(紫)', 'mat_rift_shard', 10], ['提卡爾薩德司卡(紫)', 'relic_ska_soul', 0.0001],
        ['提卡爾薩德司卡(紅)', 'mat_kukulkan_high_down', 5], ['提卡爾薩德司卡(紅)', 'item_tikal_altar_key', 2], ['提卡爾薩德司卡(紅)', 'mat_rift_shard', 10], ['提卡爾薩德司卡(紅)', 'relic_ska_armguard', 0.0001],
        ['提卡爾薩德提歐(藍)', 'mat_kukulkan_high_up', 5], ['提卡爾薩德提歐(藍)', 'item_tikal_altar_key', 2], ['提卡爾薩德提歐(藍)', 'bk_dragon_deathlightning', 0.5], ['提卡爾薩德提歐(藍)', 'mat_rift_shard', 10], ['提卡爾薩德提歐(藍)', 'relic_teo_hammer', 0.0001],
        ['提卡爾薩德提歐(黃)', 'mat_kukulkan_high_down', 5], ['提卡爾薩德提歐(黃)', 'item_tikal_altar_key', 2], ['提卡爾薩德提歐(黃)', 'bk_dragon_deathlightning', 0.5], ['提卡爾薩德提歐(黃)', 'mat_rift_shard', 10], ['提卡爾薩德提歐(黃)', 'relic_teo_footprint', 0.0001],
        ['提卡爾杰弗雷庫(雄)', 'amu_str', 8], ['提卡爾杰弗雷庫(雄)', 'acc_120', 8], ['提卡爾杰弗雷庫(雄)', 'amu_int', 8], ['提卡爾杰弗雷庫(雄)', 'acc_122', 8], ['提卡爾杰弗雷庫(雄)', 'acc_121', 8], ['提卡爾杰弗雷庫(雄)', 'amu_cha', 8], ['提卡爾杰弗雷庫(雄)', 'acc_demonbane', 10], ['提卡爾杰弗雷庫(雄)', 'rng_mr', 25], ['提卡爾杰弗雷庫(雄)', 'acc_117', 5], ['提卡爾杰弗雷庫(雄)', 'acc_summon_ctrl', 5], ['提卡爾杰弗雷庫(雄)', 'acc_116', 5], ['提卡爾杰弗雷庫(雄)', 'mat_tikal_fang', 3], ['提卡爾杰弗雷庫(雄)', 'mat_tikal_eye', 3], ['提卡爾杰弗雷庫(雄)', 'scroll_armor', 30], ['提卡爾杰弗雷庫(雄)', 'scroll_weapon', 30], ['提卡爾杰弗雷庫(雄)', 'item_kukulkan_box_high', 100], ['提卡爾杰弗雷庫(雄)', 'mat_crack_core', 100], ['提卡爾杰弗雷庫(雄)', 'relic_serpent_fang', 0.0001],
        ['提卡爾杰弗雷庫(雌)', 'amu_str', 8], ['提卡爾杰弗雷庫(雌)', 'acc_120', 8], ['提卡爾杰弗雷庫(雌)', 'amu_int', 8], ['提卡爾杰弗雷庫(雌)', 'acc_122', 8], ['提卡爾杰弗雷庫(雌)', 'acc_121', 8], ['提卡爾杰弗雷庫(雌)', 'amu_cha', 8], ['提卡爾杰弗雷庫(雌)', 'acc_demonbane', 10], ['提卡爾杰弗雷庫(雌)', 'rng_mr', 25], ['提卡爾杰弗雷庫(雌)', 'acc_117', 5], ['提卡爾杰弗雷庫(雌)', 'acc_summon_ctrl', 5], ['提卡爾杰弗雷庫(雌)', 'acc_116', 5], ['提卡爾杰弗雷庫(雌)', 'mat_tikal_fang', 3], ['提卡爾杰弗雷庫(雌)', 'mat_tikal_eye', 3], ['提卡爾杰弗雷庫(雌)', 'scroll_armor', 30], ['提卡爾杰弗雷庫(雌)', 'scroll_weapon', 30], ['提卡爾杰弗雷庫(雌)', 'item_kukulkan_box_high', 100], ['提卡爾杰弗雷庫(雌)', 'mat_crack_core', 100], ['提卡爾杰弗雷庫(雌)', 'relic_serpent_gaze', 0.0001],
        // 🏺 遺物 第十三批（v3.1.80·28 件·單一怪物專屬 0.0001%）
        ['殘暴的骷髏斧兵', 'relic_executor_axe', 0.0001],
        ['殘暴的骷髏槍兵', 'relic_executor_skewer', 0.0001],
        ['獨眼巨人', 'relic_jack_sling', 0.0001],
        ['夢魘', 'relic_endless_nightmare', 0.0001],
        ['夢幻之島大鬼火', 'relic_dullahan_ember', 0.0001],
        ['黑暗妖精警衛(矛)', 'relic_guard_roughgloves', 0.0001],
        ['黑虎', 'relic_blacktiger_whip', 0.0001],
        ['地獄束縛犬', 'relic_hellhound_chain', 0.0001],
        ['拉斯塔巴德守門人', 'relic_gatekeeper_boots', 0.0001],
        ['黑暗妖精法師', 'relic_dark_manaball', 0.0001],
        ['魔狼', 'relic_blackmane_coat', 0.0001],
        ['恐怖夢魘', 'relic_wearying_dream', 0.0001],
        ['地之牙', 'relic_earthfang_core', 0.0001],
        ['風之牙', 'relic_windfang_breeze', 0.0001],
        ['水之牙', 'relic_waterfang_tear', 0.0001],
        ['火之牙', 'relic_firefang_ember', 0.0001],
        ['馴獸師', 'relic_tamer_dogclub', 0.0001],
        ['巨大強化白螞蟻', 'relic_healer_wand', 0.0001],
        ['思克巴女皇', 'relic_succubus_temptation', 0.0001],
        ['影魔', 'relic_shadow_stinger', 0.0001],
        ['底比斯 尖碑石奴', 'relic_weathered_obelisk', 0.0001],
        ['魂騎士', 'relic_soulreaper_dual', 0.0001],
        ['遺忘之島格利芬', 'relic_griffin_feather', 0.0001],
        ['遺忘之島鏈鎚牛人', 'relic_minotaur_flail', 0.0001],
        ['遺忘之島哈維', 'relic_vigor_belt', 0.0001],
        ['炎魔的思克巴女皇', 'relic_succubus_wand', 0.0001],
        ['鬼魂', 'relic_wisp_thought', 0.0001],
        ['巫師', 'relic_warlock_grimoire', 0.0001],
        // 🐾 v3.2.17 夥伴更新遺物（第十四批·12 件·新捕捉動物 0.0001%）
        ['老虎', 'relic_tiger_fur', 0.0001],
        ['貓', 'relic_cat_paw', 0.0001],
        ['熊貓', 'relic_panda_eyes', 0.0001],
        ['高麗幼犬', 'relic_pup_fang', 0.0001],
        ['浣熊', 'relic_raccoon_leaf', 0.0001],
        ['聖伯納犬', 'relic_stbernard_barrel', 0.0001],
        ['狐狸', 'relic_fox_scarf', 0.0001],
        ['暴走兔', 'relic_rabbit_foot', 0.0001],
        ['小獵犬', 'relic_beagle_nose', 0.0001],
        ['柯利', 'relic_collie_fur', 0.0001],
        ['袋鼠', 'relic_kangaroo_gloves', 0.0001],
        ['猴子', 'relic_monkey_staff', 0.0001],
    ].forEach(function (r) { (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], r[2]]); });
    // 🏺 v3.5.27 遺物第十八批掉落（5 件·各 0.0001%·push 追加安全）
    [
        ['暗黑黑騎士', 'relic_bk_lance', 0.0001],
        ['水靈之主', 'relic_water_orb', 0.0001],
        ['遺忘之島阿魯巴', 'relic_broken_halfhelm', 0.0001],
        ['遺忘之島食人妖精王', 'relic_fire_hide', 0.0001],
        ['深淵食屍鬼', 'relic_ghoul_visage', 0.0001],
    ].forEach(function (r) { (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], r[2]]); });
    // 🐾 v3.2.17 夥伴更新：新捕捉動物一般掉落（皮革／專屬飼料 10%·依「夥伴更新.md」）
    [
        ['老虎', 'new_item_179', 10], ['貓', 'new_item_179', 10], ['浣熊', 'new_item_179', 10], ['聖伯納犬', 'new_item_179', 10],
        ['狐狸', 'new_item_179', 10], ['小獵犬', 'new_item_179', 10], ['柯利', 'new_item_179', 10],
        ['熊貓', 'item_panda_feed', 10], ['高麗幼犬', 'item_koreadog_feed', 10], ['暴走兔', 'item_carrot', 10],
        ['袋鼠', 'item_kangaroo_feed', 10], ['猴子', 'item_monkey_feed', 10],
    ].forEach(function (r) { (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], r[2]]); });
    // 🌅 日出之國（依《日出之國.md》）：13 一般怪＋3 掉落頭目（玉藻/九尾＝變身中間階段·無掉落）＋遺物 0.0001%
    //  ⚠️「體能項鍊」MD 原文對映既有「體質項鍊 acc_121」（con:1·DB 無「體能項鍊」）；體力戒指＝新增 acc_ring_con
    [
        ['嗚釜', 'mat_youkai_soul', 1], ['嗚釜', 'wpn_siruge', 0.1], ['嗚釜', 'new_item_150', 1], ['嗚釜', 'bk_elf_attrfire', 0.01], ['嗚釜', 'relic_sr_kettle_lid', 0.0001],
        ['鎌鼬', 'mat_youkai_soul', 1], ['鎌鼬', 'hlm_wind', 0.1], ['鎌鼬', 'wpn_shaha_bow', 0.001], ['鎌鼬', 'scroll_attr_wind', 0.1], ['鎌鼬', 'bk_tornado', 0.1], ['鎌鼬', 'relic_sr_kama_pot', 0.0001],
        ['轆轤首', 'mat_youkai_soul', 1], ['轆轤首', 'wpn_33', 0.1], ['轆轤首', 'wpn_redflame_sword', 0.1], ['轆轤首', 'wpn_redflame_bow', 0.1], ['轆轤首', 'scroll_attr_fire', 0.1], ['轆轤首', 'bk_elf_blazewpn', 0.1], ['轆轤首', 'relic_sr_neck_scarf', 0.0001],
        ['唐傘小僧', 'mat_youkai_soul', 1], ['唐傘小僧', 'wpn_33', 0.1], ['唐傘小僧', 'scroll_attr_water', 0.1], ['唐傘小僧', 'bk_disease', 0.1], ['唐傘小僧', 'bk_elf_muddywater', 0.1], ['唐傘小僧', 'relic_sr_old_umbrella', 0.0001],
        ['憤怒的嗚釜', 'mat_youkai_soul', 1], ['憤怒的嗚釜', 'wpn_siruge', 0.1], ['憤怒的嗚釜', 'amr_plate', 0.5], ['憤怒的嗚釜', 'bot_sephia', 0.1], ['憤怒的嗚釜', 'new_item_150', 1], ['憤怒的嗚釜', 'bk_fire_prison', 0.01], ['憤怒的嗚釜', 'relic_sr_kettle_maul', 0.0001],
        ['鎌鼬長兄', 'mat_youkai_soul', 1], ['鎌鼬長兄', 'hlm_wind', 0.1], ['鎌鼬長兄', 'wpn_ori_dagger', 0.1], ['鎌鼬長兄', 'wpn_shaha_bow', 0.001], ['鎌鼬長兄', 'scroll_attr_wind', 0.1], ['鎌鼬長兄', 'bk_tornado', 0.1], ['鎌鼬長兄', 'relic_sr_kama_blade', 0.0001],
        ['河童', 'mat_youkai_soul', 1], ['河童', 'wpn_claw_gloom', 0.1], ['河童', 'wpn_qigu_resonance', 0.01], ['河童', 'scroll_attr_water', 0.1], ['河童', 'bk_elf_watervital', 0.1], ['河童', 'acc_122', 0.001], ['河童', 'relic_sr_kappa_plate', 0.0001],
        ['赤鬼', 'mat_youkai_soul', 1], ['赤鬼', 'wpn_demon_axe', 0.01], ['赤鬼', 'scroll_attr_fire', 0.1], ['赤鬼', 'acc_ring_str', 0.01], ['赤鬼', 'armguard_con', 0.01], ['赤鬼', 'arm_47', 0.1], ['赤鬼', 'bk_warrior_berserk', 0.1], ['赤鬼', 'relic_sr_akaoni_pants', 0.0001],
        ['青鬼', 'mat_youkai_soul', 1], ['青鬼', 'scroll_weapon', 1], ['青鬼', 'scroll_armor', 1], ['青鬼', 'scroll_attr_water', 0.1], ['青鬼', 'acc_ring_con', 0.01], ['青鬼', 'armguard_con', 0.01], ['青鬼', 'bk_warrior_titan_bullet', 0.01], ['青鬼', 'relic_sr_aooni_shirt', 0.0001],
        ['鵺', 'mat_youkai_soul', 1], ['鵺', 'scroll_weapon', 1], ['鵺', 'scroll_armor', 1], ['鵺', 'scroll_attr_earth', 0.1], ['鵺', 'wpn_red_crystalwand', 0.1], ['鵺', 'acc_118', 0.01], ['鵺', 'acc_116', 0.01], ['鵺', 'mem_pain', 0.1], ['鵺', 'bk_regen', 0.1], ['鵺', 'relic_sr_nue_tail', 0.0001],
        ['天狗', 'mat_youkai_soul', 1], ['天狗', 'scroll_weapon', 1], ['天狗', 'scroll_armor', 1], ['天狗', 'scroll_attr_wind', 0.1], ['天狗', 'glv_wind_spirit', 0.1], ['天狗', 'acc_ring_dex', 0.01], ['天狗', 'bk_holy_dash', 0.1], ['天狗', 'bk_elf_stormshot', 0.01], ['天狗', 'relic_sr_tengu_fan', 0.0001],
        ['阿修羅像', 'mat_youkai_soul', 1], ['阿修羅像', 'scroll_weapon', 1], ['阿修羅像', 'scroll_armor', 1], ['阿修羅像', 'wpn_siruge', 0.1], ['阿修羅像', 'wpn_katana', 1], ['阿修羅像', 'wpn_small_katana', 1], ['阿修羅像', 'glv_official', 0.1], ['阿修羅像', 'bk_spike_armor', 0.1], ['阿修羅像', 'relic_sr_asura_arm', 0.0001],
        ['牛鬼之子', 'mat_youkai_soul', 0.1], ['牛鬼之子', 'new_item_150', 1], ['牛鬼之子', 'relic_sr_child_ring', 0.0001],
        ['白面金毛九尾狐・殺生石', 'mat_youkai_soul', 5], ['白面金毛九尾狐・殺生石', 'scroll_weapon', 10], ['白面金毛九尾狐・殺生石', 'scroll_armor', 10], ['白面金毛九尾狐・殺生石', 'scroll_attr_water', 1], ['白面金毛九尾狐・殺生石', 'scroll_attr_fire', 1], ['白面金毛九尾狐・殺生石', 'glv_water_spirit', 1], ['白面金毛九尾狐・殺生石', 'glv_fire_spirit', 1], ['白面金毛九尾狐・殺生石', 'acc_117', 1], ['白面金毛九尾狐・殺生石', 'bk_resurrection', 3], ['白面金毛九尾狐・殺生石', 'bk_fire_storm', 1], ['白面金毛九尾狐・殺生石', 'bk_meteor', 0.5], ['白面金毛九尾狐・殺生石', 'bk_heal_energy_storm', 0.5], ['白面金毛九尾狐・殺生石', 'bk_elf_attrfire', 1], ['白面金毛九尾狐・殺生石', 'bk_elf_lifebless', 1], ['白面金毛九尾狐・殺生石', 'bk_elf_lifespring', 1], ['白面金毛九尾狐・殺生石', 'wpn_onmyoji_fan', 0.1], ['白面金毛九尾狐・殺生石', 'wpn_qigu_sapphire', 0.1], ['白面金毛九尾狐・殺生石', 'acc_126', 1], ['白面金毛九尾狐・殺生石', 'amu_int', 1], ['白面金毛九尾狐・殺生石', 'wpn_katana', 10], ['白面金毛九尾狐・殺生石', 'wpn_siruge', 2], ['白面金毛九尾狐・殺生石', 'wpn_crimson_spear', 2], ['白面金毛九尾狐・殺生石', 'arm_95', 1], ['白面金毛九尾狐・殺生石', 'acc_136', 0.01], ['白面金毛九尾狐・殺生石', 'bk_warrior_titan_magic', 1], ['白面金毛九尾狐・殺生石', 'relic_sr_kyuubi_wand', 0.0001],
        ['牛鬼', 'mat_youkai_soul', 5], ['牛鬼', 'scroll_weapon', 10], ['牛鬼', 'scroll_armor', 10], ['牛鬼', 'scroll_attr_earth', 3], ['牛鬼', 'glv_earth_spirit', 3], ['牛鬼', 'clk_pride_earth', 1], ['牛鬼', 'acc_summon_ctrl', 1], ['牛鬼', 'bk_earthquake', 10], ['牛鬼', 'bk_quake', 3], ['牛鬼', 'bk_soul_up', 1], ['牛鬼', 'bk_elf_steelguard', 3], ['牛鬼', 'bk_elf_earthbless', 3], ['牛鬼', 'bk_elf_physboost', 1], ['牛鬼', 'bk_dragon_awaken_antares', 3], ['牛鬼', 'bk_elf_triple', 2], ['牛鬼', 'wpn_onmyoji_fan', 0.1], ['牛鬼', 'wpn_qigu_obsidian', 1], ['牛鬼', 'wpn_chain_destroyer', 1], ['牛鬼', 'wpn_official_2h', 3], ['牛鬼', 'wpn_vengeance', 0.1], ['牛鬼', 'acc_138', 1], ['牛鬼', 'rng_mr', 1], ['牛鬼', 'amu_str', 1], ['牛鬼', 'acc_121', 1], ['牛鬼', 'wpn_katana', 10], ['牛鬼', 'wpn_siruge', 2], ['牛鬼', 'wpn_claw_abyss', 1], ['牛鬼', 'bk_warrior_titan_rock', 1], ['牛鬼', 'relic_sr_ushioni_horn', 0.0001],
        ['巨大骷髏', 'mat_youkai_soul', 5], ['巨大骷髏', 'mat_gasha_soul', 1], ['巨大骷髏', 'scroll_weapon', 10], ['巨大骷髏', 'scroll_armor', 10], ['巨大骷髏', 'scroll_attr_earth', 3], ['巨大骷髏', 'scroll_attr_water', 3], ['巨大骷髏', 'scroll_attr_fire', 3], ['巨大骷髏', 'scroll_attr_wind', 3], ['巨大骷髏', 'acc_117', 5], ['巨大骷髏', 'acc_summon_ctrl', 5], ['巨大骷髏', 'acc_116', 5], ['巨大骷髏', 'bk_abs_barrier', 5], ['巨大骷髏', 'bk_resurrection', 1], ['巨大骷髏', 'bk_blizzard_storm', 1], ['巨大骷髏', 'bk_disintegrate', 1], ['巨大骷髏', 'bk_meteor', 1], ['巨大骷髏', 'bk_elf_stormshot', 3], ['巨大骷髏', 'bk_elf_flamesoul', 3], ['巨大骷髏', 'bk_dragon_awaken_baraka', 3], ['巨大骷髏', 'bk_elf_triple', 2], ['巨大骷髏', 'bk_elf_soul', 2], ['巨大骷髏', 'wpn_onmyoji_fan', 0.1], ['巨大骷髏', 'blt_gasha_ring', 0.1], ['巨大骷髏', 'wpn_qigu_meditate', 1], ['巨大骷髏', 'wpn_chain_bloodthirst', 1], ['巨大骷髏', 'wpn_giantaxe', 10], ['巨大骷髏', 'wpn_demon_axe', 1], ['巨大骷髏', 'wpn_thor_hammer', 1], ['巨大骷髏', 'wpn_demon_axehead', 1], ['巨大骷髏', 'acc_122', 1], ['巨大骷髏', 'acc_121', 1], ['巨大骷髏', 'wpn_katana', 10], ['巨大骷髏', 'wpn_siruge', 2], ['巨大骷髏', 'wpn_dual_abyss', 1], ['巨大骷髏', 'wpn_rond_dual', 1], ['巨大骷髏', 'bot_courage', 1], ['巨大骷髏', 'bot_mana', 1], ['巨大骷髏', 'bk_dark_armorbreak', 1], ['巨大骷髏', 'acc_136', 1], ['巨大骷髏', 'acc_137', 1], ['巨大骷髏', 'acc_135', 1], ['巨大骷髏', 'bk_counter_barrier', 1], ['巨大骷髏', 'relic_sr_gasha_skull', 0.0001],
    ].forEach(function (r) { (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], r[2]]); });
    // 🗡️ v3.4.33 倫得雙刀（黑暗妖精雙刀·雙擊33/貫穿/5% 復仇尖石）：死亡騎士 0.1%／真‧死亡騎士 冥皇丹特斯 1%
    [
        ['死亡騎士', 'wpn_rond_dual', 0.1],
        ['真‧死亡騎士 冥皇丹特斯', 'wpn_rond_dual', 1],
    ].forEach(function (r) { (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], r[2]]); });
    // 🌑 v3.4.67 解除詛咒的真死亡騎士．冥皇執行劍：真‧死亡騎士 冥皇丹特斯 0.0001%
    (MOB_DROPS['真‧死亡騎士 冥皇丹特斯'] = MOB_DROPS['真‧死亡騎士 冥皇丹特斯'] || []).push(['wpn_uncursed_emperor_blade', 0.0001]);
    // 🌀 魔法書(治癒能量風暴)：長老．巴塔斯 0.1%／吉爾塔斯 1%／翼龍 0.01%
    [
        ['長老．巴塔斯', 'bk_heal_energy_storm', 0.1],
        ['吉爾塔斯', 'bk_heal_energy_storm', 1],
        ['翼龍', 'bk_heal_energy_storm', 0.01],
    ].forEach(function (r) { (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], r[2]]); });
    // 🌊 精靈水晶(污濁之水)：法利昂 1%／水精靈王 0.01%／黑長者 0.1%
    [
        ['法利昂', 'bk_elf_muddywater', 1],
        ['水精靈王', 'bk_elf_muddywater', 0.01],
        ['黑長者', 'bk_elf_muddywater', 0.1],
    ].forEach(function (r) { (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], r[2]]); });
    // 🏺 v3.1.15：潛行者的祕密箱子 改由「密密」掉落（原艾爾摩法師取消，該怪僅保留凋零法師的護身符）；巨大鱷魚的狩獵牙 改由「巨大鱷魚」掉落（原格利芬取消，該怪僅保留獅鷲的鋒利鷹爪）。

    // 區域額外掉落（眠龍洞穴1~3樓=zone_15/16/17、妖精森林周邊=zone_01 所有怪物）
    // 粗糙的米索莉塊 / 元素石各 2%，學會「世界樹的呼喚」則各 3%；精靈玉維持 20% / 30%
    const AREA_BONUS_MAPS = ['zone_15', 'zone_16', 'zone_17', 'zone_01'];
    const AREA_BONUS_ITEMS = ['new_item_164', 'new_item_195', 'new_item_165'];

// ===== 🔧 計時慣例（單一事實來源，新增任何計時效果前先讀這裡）=====
// • player.statuses（異常狀態）：以 tick(0.1秒) 計，於 tick() 開頭的通用迴圈「統一」遞減，勿在他處再扣
// • player.buffs（增益）：以「秒」計，於 tick() 的每秒區塊（state.ticks % 10）「統一」遞減，勿在他處再扣
// • player.cds.atkSk / healSk / purifySk / convertSk：以 tick 計（施法節奏只看職業／變身 cast，不受攻擊速度影響）
// • player.cds.pot / reviveScrollCd / magicShieldCd：以秒計（tick() 的每秒區塊遞減）
// • player.siege（攻城勝利8折、宣戰冷卻）：牆鐘 Date.now()，刻意設計為關閉遊戲仍流逝
// • 召喚物 / 迷魅 endTick：絕對 tick，已隨存檔保存（saveGame 的 ticks 欄位），重載後仍有效
const BUFF_NAMES = {   // buff 鍵 → 顯示名稱（DB.skills 查不到時使用）
    haste: "加速", brave: "勇敢藥水", blue: "藍色藥水", cautious: "慎重藥水",
    elfcookie: "精靈餅乾", poly: "變身", shield: "保護罩", taming: "誘捕", sk_set_dragonscion: "龍裔"
};
// ===== 🔧 架構#3：物品「同一性簽章」單一事實來源 =====
// 判斷兩件物品是否「完全相同（可堆疊/可合併/可比對）」一律使用 itemSig / sameItemSig，
// 涵蓋：id、強化值 en（undefined 正規化為 0）、祝福 true→'B' / 詛咒 'cursed'→'C'、
// 遠古變體 true→'A'（其餘 'eternal'/'immortal'/'primordial' 原值）、屬性詞綴 attr。
// 使用處：gainItem 堆疊、卸裝/換裝退回背包合併、倉庫一鍵存入(whSig)/堆疊(_whStackFind)、
// 載入合併(consolidateInventory)、分頁重繪記憶簽章(renderTabs)。勿再各自手寫比對條件。
function itemSig(it) { let _ams = Math.max(1, Math.min(3, Math.floor(Number(it.attrMagicStar) || 1))); return it.id + '|' + (it.en || 0) + '|' + (it.bless === true ? 'B' : (it.bless ? 'C' : 0)) + '|' + (it.anc === true ? 'A' : (it.anc || 0)) + '|' + (it.attr || '') + '|' + (it.seteff || '') + (it.attrMagic ? '|' + it.attrMagic + (_ams > 1 ? '@' + _ams : '') : ''); }   // 來源、uid、鎖定與廢品旗標不入鍵；同能力物品不論來源皆可疊加。
function sameItemSig(a, b) { return itemSig(a) === itemSig(b); }
// 🔒 v3.6.92 「退回背包」的堆疊合併單一真相（卸裝/換裝/箭矢同步/副手同步/舊檔遷移共 6 處呼叫）：
//    ① 併入同簽章堆疊——含鎖定疊（現行不變量＝同簽章永遠只有一格；舊制刻意跳過鎖定疊會多開一格）。
//    ② 不併入「已標廢品」的堆疊：退回的裝備會跟著被自動販賣掃走。
//    ③ 保護狀態只會擴散、不會遺失：來源鎖定→整疊鎖定並清掉廢品標記
//       （舊制沒有這步——鎖定的裝備卸下併入未鎖疊時，鎖定狀態會靜默消失）。
//    ④ 巨靈願望戒指(gw)每只的願望各自獨立，而 itemSig 不含 gw → 兩側都要排除，否則併疊會吃掉一份願望。
function _invStackFind(e, includeJunk) {
    if (!e || e.gw || !Array.isArray(player.inv)) return null;
    return player.inv.find(i => !i.gw && (includeJunk || !i.junk) && sameItemSig(i, e));
}
// 新取得的物品統一入口：來源不影響疊加；鎖定只會擴散，不會因合併遺失。
function invAddOrStack(e) {
    if (!e) return null;
    if (!Array.isArray(player.inv)) player.inv = [];
    let ex = _invStackFind(e, true);
    if (typeof _itemTransaction !== 'undefined' && _itemTransaction) {
        let count = _itemTransactionCount(e.cnt);
        if (ex) ex.cnt = _itemTransactionCount(_itemTransactionCount(ex.cnt) + count);
        else { e.cnt = count; player.inv.push(e); return e; }
        if (e.lock) { ex.lock = true; ex.junk = false; }
        return ex;
    }
    if (!ex) { player.inv.push(e); return e; }
    ex.cnt = (ex.cnt || 1) + (e.cnt || 1);
    if (e.lock) { ex.lock = true; ex.junk = false; }
    return ex;
}
// 回傳 true＝已併入既有堆疊；false＝呼叫端需自行 player.inv.push(e)。
function invMergeBack(e) {
    if (!e || e.gw) return false;
    let ex = _invStackFind(e, false);
    if (!ex) return false;
    ex.cnt = (ex.cnt || 1) + (e.cnt || 1);
    if (e.lock) { ex.lock = true; ex.junk = false; }
    return true;
}

// ===== 🔧 架構#6：存檔版本與集中式預設值 =====
// 存檔寫入 v 欄位（SAVE_VERSION）；loadGame 在跑完「轉換型」舊檔遷移後呼叫 applySaveDefaults()
// 統一補齊缺漏欄位（含巢狀物件的個別 key），不覆蓋既有值。
// 【日後新增 player 欄位時：只需在 SAVE_DEFAULTS 加一行；除非涉及格式轉換，不必再到 loadGame 寫 if(undefined)。】
const SAVE_VERSION = 2;   // v1 = 未標版本的舊存檔
const SAVE_DEFAULTS = {
    name: null, bonus: 0, panaceaUsed: 0, bloodPledge: null, lootSeq: 0,
    magicShieldCd: 0, reviveScrollCd: 0, lastMapByCat: {}, lastBattleMap: null, tracking: null, sherineWorld: false, sherineMad: false, classicMode: false, traditionalMode: false,
    masteryQuest: null, mastery: null, masteryChangeCnt: 0,
    prideBeatJenis: false, demonTempleOpen: false, flameAffinity: 0, trialStage: 0, prideRank: { best: null, last: null, isNew: false }, prideRankSherine: { best: null, last: null, isNew: false },
    riftRank: { best: null, last: null, isNew: false }, riftRankSherine: { best: null, last: null, isNew: false }, riftRewardMs: null,
    elfEle: null, poly: null, summon: null, charmed: null, hots: {},   // 🔧 v3.5.94 移除零讀取的舊制孤兒欄位 hot(單數)；團隊 HoT 休眠機制實際用的是 hots(複數 dict)，改在此初始化與 js/05/js/13 重設點一致
    manualCd: {}, cardDex: {}, cardDexV: 0, equipDex: {}, miscDex: {},
    alloc:   { str:0, dex:0, con:0, int:0, wis:0, cha:0 },
    panacea: { str:0, dex:0, con:0, int:0, wis:0, cha:0 },
    cds:     { pot:0, atkSk:0, healSk:0, purifySk:0, convertSk:0 },
    buffs:   { haste:0, brave:0, blue:0, cautious:0, elfcookie:0, poly:0, shield:0, sk_magic_shield:0 },
    statuses:{ stun:0, freeze:0, stone:0, poison:0, poisonDmg:0, poisonTick:0, burn:0, burnDmg:0, burnTick:0,
               scald:0, scaldDmg:0, scaldTick:0, bleed:0, bleedDmg:0, bleedTick:0, sleep:0, silence:0, paralyze:0, magicseal:0, armorBreak:0, slowAtk:0, cleave:0, bind:0 },   // 🕸️ v3.7.75 bind 束縛（舊存檔由 applySaveDefaults 自動補鍵）
    siege:   { active:false, city:'kent', gateKilled:false, towerKilled:false, endTime:0, kills:0, result:null,
               cooldownUntil:0, accCdUntil:0 }
};
function applySaveDefaults(p) {
    for (let k in SAVE_DEFAULTS) {
        let dv = SAVE_DEFAULTS[k];
        if (dv !== null && typeof dv === 'object' && !Array.isArray(dv)) {
            if (!p[k] || typeof p[k] !== 'object') p[k] = {};
            for (let kk in dv) if (p[k][kk] === undefined) p[k][kk] = dv[kk];
        } else if (p[k] === undefined) {
            p[k] = dv;
        }
    }
}

// ============================================================================
// 🔮 席琳的世界（席琳神殿「祈禱」開關，Lv40+；存於 player.sherineWorld / player.sherineMad，兩者互斥）
//  - 視覺：body 加 sherine-world class（一般／瘋狂皆加）；瘋狂另加 sherine-mad
//  - 怪物（攻城區與血盟敵人除外）　值＝[一般席琳 / 瘋狂席琳]：
//      HP×[3/5]、AC×[1.5/1.75]、MR×[1.5/3]、命中×[1.5/2]、額外減傷 +floor(等級/3)、
//      經驗×[5/10]、金錢×[5/10]、一般攻擊傷害×[2/3]、技能最終傷害×[2/3]（含持續傷害）；
//      生怪等待 ×0.8（v3.4.26 由「−1 秒」改乘算·與日光術 ×0.8 相乘疊加；下限 0.5 秒）
//  - 掉落：物品掉落機率×[3/5]、詞綴(祝福)機率×[3/5]
//      ⚠️ v3.5.96 更正：本區塊原寫「指定部位裝備可附『席琳套裝效果』」與「席琳套裝效果(席琳詞綴)瘋狂＝3 倍」，
//         但 v3.1.68 起套裝詞綴**已不再附在裝備上**（js/08 seteff 硬編 false·改由 8 格席琳遺骸 rem_* 欄承載），
//         現行席琳世界只影響「掉落機率」與「祝福詞綴機率」兩項。席琳結晶掉率的 3 倍仍成立。
//  - 恩賜（applySherineGrace）：席琳世界每次刷新 1% 機率讓場上一隻怪（含頭目）獲恩賜；
//      無冷卻、場上同時僅一隻；HP×10／經驗×10／金錢×10／掉落×10／持續傷害再×2
// ============================================================================
function sherineWorldActive() { return !!(player && (player.sherineWorld || player.sherineMad)); }   // 🔮 一般或瘋狂任一開啟皆視為「席琳的世界」（主題/排名/結晶/套裝效果/出怪強化共用此閘）
function sherineMadActive() { return !!(player && player.sherineMad); }   // 🔮 僅「瘋狂的席琳世界」：供倍率分流
function applySherineTheme() { document.body.classList.toggle('sherine-world', sherineWorldActive()); document.body.classList.toggle('sherine-mad', sherineMadActive()); }
let _sherineLootCtx = null;   // 擊殺掉落上下文：killMob 期間設定 { mad }，try/finally 清除。一般怪祝福率 ×3/×5；頭目搭配 _lootMobInfo.boss 固定為席琳 20%／瘋狂席琳 30%。
//   （🗑️ v3.5.95 刪除此處三行舊註解：它們還在描述已於 v3.5.94 移除的 boss / grace 兩欄，與上一行的「單鍵」敘述互斥，
//     會讓維護者去找兩個不存在的欄位。所有必要資訊都已併入上一行。）
let _forceSherineSet = false;   // 🔮 席琳製作：成品必定附帶隨機套裝效果（doCraft 產出期間設定）
let _tradLootCtx = false;   // 🏛️ 傳統模式「掠奪上下文」（⚠️v3.0.83 傳統模式已取消：旗標已無消費者·僅保留宣告讓各處 set/restore 站點不拋錯）
let _noAffixCtx = false;    // 🦴 「白板上下文」：設 true 時 gainItem 不附加詞綴（祝福/詛咒/屬性）但仍放行傳統自帶強化值——供寵物裝備製作（白板＋隨機強化值，機率同飾品）
let _forceBless = false;    // 🔧 v3.1.27 製作：設 true 時 gainItem 產出必定祝福（doCraft 消耗到祝福裝備材料時逐件設定；寵物白板 _noAffixCtx 仍優先擋）
// 🔒 v3.6.92 一次性關閉「併入鎖定堆疊」：唯一設定點＝js/14 ensureMaterial（製作遞迴補製中間物）。
//    通則是「再次獲得同物品→直接併同一格、整疊受鎖定保護」（用戶拍板），但製作遞迴的中間物若併進鎖定疊，
//    invCountId/buildPool（皆排除鎖定件）看不到它 → 父層 consumeMaterialById 扣不到 → 底層材料被吃掉、中間物卻沒扣。
//    故中間物一律另開未鎖定疊、當場被父層消耗掉；殘量待下次 consolidateInventory 併回。
let _lockMergeOff = false;
let _craftBlessCount = 0;   // 🔧 v3.1.27 製作：本次 doCraft 消耗到的「祝福裝備」材料件數（consumeMaterialById/whConsumeId 累加·doCraft 前歸零、依此逐件強制祝福）
let _vfxLootCtx = false;   // ✨ VFX：擊殺掉落期間設 true，供 gainItem 判定稀有(潘朵拉權重=1)掉落閃光
let _lootMobInfo = null;   // 🐾 擊殺掉落期間設 {n,lv,boss}＝掉落來源怪物；boss 另供 gainItem 套用頭目掉落 10% 祝福率。（商店/製作/NPC 兌換為 null）

// ===== 🔮 席琳套裝效果（9 組；不再分五種詞綴，seteff 直接存「套裝名」＝組名）=====
// 掉落判定：席琳的世界中，武器/頭盔/盔甲/手套/長靴/斗篷/腰帶 掉落時，
// 一般怪 0.1%、頭目 5% 獨立機率獲得一個套裝效果（再從 9 組均勻抽一）。
// 觸發＝「相同套裝名、不同部位」的件數（同名不同部位即累計，5 個不同部位＝5 件效果）。
// 套裝名冠在裝備名稱前（如「紅獅環甲」），資訊欄列出 2/3/5 件加成；名稱顏色規則同前（c-sherine 鮮綠＋光暈）。
// ⚠️ 舊存檔的具名 seteff（如「紅獅的復仇」）仍相容：各處一律以 seteff.slice(0,2) 取組名。
const SHERINE_EFFECTS = ['紅獅','白鳥','鐵衛','麗人','疾風','月光','學徒','魔女','暗影','幻覺','龍血','狂怒'];   // ⚠️ 各名稱 slice(0,2) 須唯一（計件用）：幻覺/龍血/狂怒 與既有皆不撞
// 套裝加成說明（資訊欄顯示用；計數=身上「不重複效果」數，同效果兩件只算 1）
const SHERINE_SET_TEXT = {
    '紅獅': ['2件：額外傷害+5、額外魔法點數+3', '3件：傷害減免+10', '5件：最終傷害+10%（普攻與技能皆適用）'],
    '白鳥': ['2件：額外命中+5', '3件：魅力+10', '5件：一般攻擊命中時使目標「脆弱」3秒（受所有來源傷害+10%，重複觸發刷新）'],
    '鐵衛': ['2件：AC-3、傷害減免+5', '3件：受到傷害減少20%', '5件：一般攻擊命中附加嘲諷 3 秒，使目標優先攻擊自身；受嘲諷目標的一般攻擊傷害-10%'],
    '麗人': ['2件：近距離傷害+3、近距離命中+3', '3件：近距離爆擊率+3%', '5件：裝備近距離武器時，攻擊速度+20%'],
    '疾風': ['2件：遠距離傷害+3、遠距離命中+3', '3件：遠距離爆擊率+3%', '5件：連射傷害由30%提升為80%'],
    '月光': ['2件：額外傷害+2、額外命中+3', '3件：ER+5、MR+10', '5件：一般攻擊或技能造成傷害時，使目標「碎裂」3秒（AC-10，最多1層，重複觸發刷新）'],
    '學徒': ['2件：MP自然恢復+5、額外魔法點數+6', '3件：魔法爆擊率+3%', '5件：MP 低於最大值30%時，所有技能 MP 消耗減半（MP回升超過30%即恢復）'],
    '魔女': ['2件：魔法傷害+3', '3件：水屬性抗性+10、額外魔法點數+5', '5件：每觸發 5 次共鳴，免費發動一次冰雪暴（無需學會）'],
    '暗影': ['2件：額外傷害+7', '3件：裝備鋼爪、雙刀時，雙擊觸發機率+20%', '5件：雙擊觸發的額外一般攻擊傷害加倍'],
    '幻覺': ['2件：立方、冰雪颶風／火牢持續傷害、魔爆及武器內建／免費觸發魔法每次發動並造成傷害時，恢復一次「等級/10」的MP（不因命中多名敵人重複恢復）', '3件：輔助技能消耗MP減少50%', '5件：上述魔法造成傷害時，再次造成額外相同傷害（不包含一般傷害法術、共鳴與反射；額外傷害不再觸發套裝效果）'],
    '龍血': ['2件：造成物理傷害時恢復1%該傷害的HP（自身HP低於50%時改為5%）', '3件：施放消耗HP的技能可獲得「龍裔」10秒，受到傷害減少15%', '5件：消耗HP技能造成傷害提高20%'],
    '狂怒': ['2件：負重上限+500', '3件：最大HP+20%', '5件：HP每少10%，造成傷害+3%、受到傷害-3%（最多±15%，即HP低於50%時達上限）']
};
// ===== 🦴 v3.1.68 席琳遺骸系統（單一真相表）＝套裝效果新載體 =====
// 套裝詞綴「不再出現於裝備上」（gainItem 掉落/製作附加已停用）；現有裝備詞綴保留（名稱/資訊欄照舊）但不再計入套裝件數。
// 套裝效果判定改看 8 格「遺骸」裝備欄（裝備分頁最底部 8 格·浮動裝備視窗不顯示）：每件遺骸必附一種席琳詞綴(seteff)，
// 「相同組名的遺骸格數」達 2/3/5 → 發動現行套裝效果（門檻/效果內容不變·recomputeStats 計件迴圈改掃此 8 格）。
// 遺骸：視為飾品(type:acc)·noEnhance·不可賦予屬性(僅武器可)·潘朵拉權重0·重量0；只在席琳世界掉落
// （機率=0.001×怪等·頭目0.01×等·瘋狂×3·killMob js/05）；NPC 伊奧(席琳結晶兌換)/菈克希絲(穿著裝備拆分)於 js/12。
// eqSlot＝對應的「裝備部位」（菈克希絲拆分映射：該部位裝備的席琳詞綴 → 對應遺骸）；遺骸自身的裝備欄鍵＝id。
const SHERINE_REMAINS = [
    { id: 'rem_claw',  n: '之爪', eqSlot: 'wpn' },
    { id: 'rem_eye',   n: '之眼', eqSlot: 'helm' },
    { id: 'rem_blood', n: '之血', eqSlot: 'cloak' },
    { id: 'rem_flesh', n: '之肉', eqSlot: 'boots' },
    { id: 'rem_heart', n: '之心', eqSlot: 'belt' },
    { id: 'rem_bone',  n: '之骨', eqSlot: 'gloves' },
    { id: 'rem_fang',  n: '之牙', eqSlot: 'shield' },
    { id: 'rem_scale', n: '之鱗', eqSlot: 'armor' }
];
// 🔮 席琳套裝效果「可附加部位」判定（唯一真相；⚠️v3.1.68 起 gainItem 不再對裝備附加席琳詞綴——本函式僅供
//   菈克希絲拆分/舊資料判讀等沿用；試煉「席琳兌換」綠鈕已移除）
//   合法部位：武器（非箭矢）/頭盔/盔甲/手套/長靴/斗篷/腰帶；盾牌(slot:shield)等不符 → 不可附帶套裝效果。
function sherineSetEligible(d) {
    if (isRelic(d)) return false;   // 🏺 遺物永不附帶席琳套裝詞綴（席琳的世界亦然）→ 永遠維持單一能力
    return !!(d && (
        (d.type === 'wpn' && !d.isArrow)
        || (d.type === 'arm' && ['helm','armor','shin','gloves','boots','cloak','shield'].includes(d.slot))   // 🛡️ shield 槽＝盾牌＋臂甲（副手）：可附席琳套裝詞綴；🦵 shin=脛甲
        || ((d.type === 'acc' || d.type === 'arm') && d.slot === 'belt')
    ));
}
// 🔧 黑暗妖精武器掉落表（怪物名稱 → [[武器ID, 機率%], ...]；於擊殺結算套用，受席琳世界 _dropMult 影響）
const DARK_WEAPON_DROPS = {
    '妖魔殭屍': [['wpn_claw_bronze',0.1],['wpn_claw_steel',0.1]],
    '骷髏': [['wpn_claw_bronze',0.1],['wpn_claw_steel',0.1]],
    '骷髏弓箭手': [['wpn_claw_bronze',0.1],['wpn_claw_steel',0.1],['wpn_xbow_dark',0.01]],
    '史巴托': [['wpn_claw_bronze',0.1],['wpn_claw_steel',0.1],['wpn_dual_bronze',0.1],['wpn_dual_steel',0.1]],
    '石頭高崙': [['wpn_claw_bronze',0.1],['wpn_claw_steel',0.1],['wpn_dual_bronze',0.1],['wpn_dual_steel',0.1]],
    '蜥蜴人': [['wpn_claw_steel',0.1],['wpn_dual_bronze',0.1],['wpn_dual_steel',0.1]],
    '歐熊': [['wpn_claw_steel',0.1]],
    '影魔': [['wpn_claw_shadow',0.5]],
    '毒蠍': [['wpn_claw_dark',0.1],['wpn_dual_dark',0.1]],
    '冰之女王': [['wpn_claw_gloom',1],['wpn_dual_gloom',1],['wpn_xbow_gloom',1],['wpn_qigu_frost',0.1]],
    '妖魔鬥士': [['wpn_dual_bronze',0.1]],
    '狼人': [['wpn_dual_steel',0.1]],
    '萊肯': [['wpn_dual_steel',0.5]],
    '死神': [['wpn_dual_dark',0.5]],
    '變形怪': [['wpn_dual_shadow',0.5]],
    '黑騎士': [['wpn_dual_shadow',0.1]],
    '妖魔弓箭手': [['wpn_xbow_dark',0.01]],
    '不死鳥': [['wpn_manadagger',0.1],['new_phoenix_heart',1]],
    '伊弗利特': [['wpn_manadagger',0.1],['wpn_qigu_resonance',0.1]],
    '巴拉卡斯': [['wpn_manadagger',1],['wpn_qigu_resonance',1]]
};
// 🐉 龍騎士掉落表（怪物名稱 → [[物品ID, 機率%], ...]；僅龍騎士主玩家擊殺時判定，受 _dropMult／經典模式影響）。含任務道具、龍騎士書板、鎖鏈劍
const DRAGON_DROPS = {
    // 任務道具
    '甘地妖魔': [['item_demon_search',1]], '都達瑪拉妖魔': [['item_demon_search',1]], '羅孚妖魔': [['item_demon_search',1]], '阿吐巴妖魔': [['item_demon_search',1]],
    '蛇女': [['item_demon_spy',1]],
    '雪怪': [['item_yeti_heart',10],['wpn_chain_resonance',0.01]],
    '火焰之靈魂(紅)': [['item_soulfire_ash',1]], '火焰之靈魂(藍)': [['item_soulfire_ash',1]],
    // 書板：岩漿噴吐
    '妖魔法師': [['bk_dragon_lavaspit',0.1]], '火之牙': [['bk_dragon_lavaspit',0.1]], '地獄犬': [['bk_dragon_lavaspit',0.1]],
    '地獄束縛犬': [['bk_dragon_lavaspit',0.1],['bk_dragon_reaper',0.05]],
    '伊弗利特': [['bk_dragon_lavaspit',1]],
    '幼龍': [['bk_dragon_lavaspit',0.75],['bk_dragon_awaken_antares',0.5]],
    // 書板：覺醒安塔瑞斯
    '巨蟻': [['bk_dragon_awaken_antares',0.01]], '阿魯巴': [['bk_dragon_awaken_antares',0.3]], '歐熊': [['bk_dragon_awaken_antares',0.1]],
    '巨大兵蟻': [['bk_dragon_awaken_antares',0.01]], '楊果里恩': [['bk_dragon_awaken_antares',0.04]],
    // 書板：岩漿之箭
    '克特': [['bk_dragon_lavabolt',0.1]], '闇黑的騎士范德': [['bk_dragon_lavabolt',0.1]], '墮落': [['bk_dragon_lavabolt',0.1]],
    // 書板：覺醒法利昂
    '活鎧甲': [['bk_dragon_awaken_falion',0.1]], '希爾黛斯': [['bk_dragon_awaken_falion',0.1]],
    // 書板：致命身軀
    '魔獸軍王巴蘭卡': [['bk_dragon_deadlybody',1]], '巨大墳墓守護者': [['bk_dragon_deadlybody',0.5]], '黑暗妖精殘兵(劍)': [['bk_dragon_deadlybody',0.3]], '奇美拉': [['bk_dragon_deadlybody',0.3]],
    '食人妖精王': [['bk_dragon_deadlybody',0.1],['wpn_chain_resonance',0.001]],
    // 書板：奪命之雷
    '深淵風靈': [['bk_dragon_deathlightning',0.5]], '風靈之主': [['bk_dragon_deathlightning',0.5]],
    // 書板：驚悚死神
    '巴風特': [['bk_dragon_reaper',0.1]], '巴列斯': [['bk_dragon_reaper',0.1]], '恐怖的殭屍王': [['bk_dragon_reaper',0.1]], '不滅的巫妖': [['bk_dragon_reaper',0.1]], '烈炎獸': [['bk_dragon_reaper',0.05]],
    // 書板：覺醒巴拉卡斯（惡魔同時掉驚悚死神0.1 + 巴拉卡斯1）
    '惡魔': [['bk_dragon_reaper',0.1],['bk_dragon_awaken_baraka',1]],
    '艾莉絲': [['bk_dragon_awaken_baraka',0.1]], '熔岩高崙': [['bk_dragon_awaken_baraka',0.01]], '冷酷的艾莉絲': [['bk_dragon_awaken_baraka',1]], '骨龍': [['bk_dragon_awaken_baraka',0.1]], '墳墓守護者騎士': [['bk_dragon_awaken_baraka',0.1]],
    // 鎖鏈劍
    '受詛咒的艾爾摩士兵': [['wpn_chain_bloodthirst',0.01]], '恐怖的吸血鬼': [['wpn_chain_bloodthirst',0.1]], '馬昆斯吸血鬼': [['wpn_chain_bloodthirst',0.01]],
    '巨大鱷魚': [['wpn_chain_resonance',0.03]],
    '冰魔': [['wpn_chain_frost',0.1]]
};
// ⚔️ 戰士技能印記掉落表（怪物名稱 → [[印記ID, 機率%], ...]）：全職可掉（印記為技能書，僅戰士可學）。受 _dropMult／經典模式影響。
const WARRIOR_DROPS = {
    // 粉碎
    '毒蠍': [['bk_warrior_crush',0.01]], '阿魯巴': [['bk_warrior_crush',0.05]], '歐姆': [['bk_warrior_crush',0.01]], '歐姆裝甲兵': [['bk_warrior_crush',0.05]], '墳墓守護者': [['bk_warrior_crush',0.1]], '墳墓守護者騎士': [['bk_warrior_crush',0.3]], '墮落': [['bk_warrior_crush',0.5]],
    // 護甲身軀
    '冰石高崙': [['bk_warrior_armorbody',0.001]], '鋼鐵高崙': [['bk_warrior_armorbody',0.01]], '恐怖的鋼鐵高崙': [['bk_warrior_armorbody',0.05]],
    // 護甲身軀（與既有戰士試煉掉落同怪：石頭高崙=護甲身軀0.0001＋生命卷軸；熔岩高崙=護甲身軀0.01）
    '石頭高崙': [['bk_warrior_armorbody',0.0001]], '熔岩高崙': [['bk_warrior_armorbody',0.01]],
    // 狂暴
    '小惡魔': [['bk_warrior_berserk',0.001]], '殘暴的骷髏斧兵': [['bk_warrior_berserk',0.01],['wpn_iron_axehead',0.005]], '殘暴的史巴托': [['bk_warrior_berserk',0.01]], '地獄的黑豹': [['bk_warrior_berserk',0.5]],
    // 泰坦：岩石
    '魔獸軍王巴蘭卡': [['bk_warrior_titan_rock',0.5]], '巨人戰士': [['bk_warrior_titan_rock',0.001]],
    // 泰坦：魔法
    '黑暗妖精殘兵(法師)': [['bk_warrior_titan_magic',0.001]], '法令軍王蕾雅': [['bk_warrior_titan_magic',0.5]],
    // 泰坦：子彈
    '暗殺軍王史雷佛': [['bk_warrior_titan_bullet',0.5]], '黑暗妖精殘兵(十字弓)': [['bk_warrior_titan_bullet',0.001]],
    // 戰斧投擲
    '骷髏弓箭手': [['bk_warrior_throwaxe',0.001]], '巨大兵蟻': [['bk_warrior_throwaxe',0.01]], '黑騎士': [['bk_warrior_throwaxe',0.01]], '骷髏鬥士': [['bk_warrior_throwaxe',0.1]], '阿西塔基奧': [['bk_warrior_throwaxe',0.3]],
    // 體能強化
    '獨眼巨人': [['bk_warrior_endurance',0.01]], '巨人': [['bk_warrior_endurance',0.01]], '巨人長老': [['bk_warrior_endurance',0.05]],
    // 古代巨人：泰坦：岩石 0.5 + 體能強化 0.5
    '古代巨人': [['bk_warrior_titan_rock',0.5], ['bk_warrior_endurance',0.5], ['wpn_giant_axehead',0.1]],
    // ⚔️ 戰士武器掉落（鐵斧頭）
    '暗黑萊肯': [['wpn_iron_axehead',0.01]], '多羅': [['wpn_iron_axehead',0.001]], '死亡': [['wpn_iron_axehead',0.1]],
    // 亡命之徒（墮落的鐮刀死神→實際怪名「邪惡的鐮刀死神」）
    '邪惡的鐮刀死神': [['bk_warrior_outlaw',1]], '死亡之劍': [['bk_warrior_outlaw',0.01]]
};
// 🔮 記憶水晶掉落表（幻術士法術書·全職可掉，怪物名稱 → [[mem_ID, 機率%], ...]）：killMob 獨立 roll、受 _dropMult／經典模式影響；與 MOB_DROPS 既有的底比斯心靈破壞/立方地裂掉落並存疊加。多水晶怪（哈維/遺忘之島巨大牛人/思克巴）合併於單一鍵避免重複鍵覆蓋。
const MEM_DROPS = {
    // 心靈破壞 mem_mindbreak
    '混沌': [['mem_mindbreak',2.5]], '死亡': [['mem_mindbreak',2.5]], '多眼怪': [['mem_mindbreak',0.5]], '梅杜莎': [['mem_mindbreak',0.5]],
    // 立方：地裂 mem_cube_quake
    '遺忘之島巨斧牛人': [['mem_cube_quake',0.5]], '莫妮亞': [['mem_cube_quake',0.4]], '犰狳': [['mem_cube_quake',0.1]],
    '哈維': [['mem_mindbreak',0.1],['mem_cube_quake',0.1]],            // 心靈破壞 + 立方地裂
    '遺忘之島巨大牛人': [['mem_cube_quake',0.8],['mem_pain',0.8]],     // 立方地裂 + 疼痛
    // 幻想 mem_fantasy
    '不幸的幻象眼魔': [['mem_fantasy',2]], '小幻象眼魔': [['mem_fantasy',1]], '卡司特王': [['mem_fantasy',0.1]], '奇美拉': [['mem_fantasy',0.1]], '毒蠍': [['mem_fantasy',0.1]], '卡司特': [['mem_fantasy',0.05]],
    // 幻覺：鑽石高崙 mem_golem
    '鋼鐵高崙': [['mem_golem',0.5]], '熔岩高崙': [['mem_golem',0.5]], '冰石高崙': [['mem_golem',0.05]],
    // 洞察 mem_insight
    '墳墓守護者法師': [['mem_insight',1]], '受詛咒的艾爾摩法師': [['mem_insight',0.5]], '黑暗妖精法師': [['mem_insight',0.1]], '艾爾摩法師': [['mem_insight',0.05]], '黑暗妖精殘兵(法師)': [['mem_insight',0.1]],
    // 恐慌 mem_panic
    '巴風特': [['mem_panic',1.5]], '變形怪首領': [['mem_panic',1]], '黑法師': [['mem_panic',0.1]],
    // 疼痛的歡愉 mem_pain
    '邪惡的鐮刀死神': [['mem_pain',2.5]], '傲慢的潔尼斯女王': [['mem_pain',2]], '扭曲的潔尼斯女王': [['mem_pain',2]], '不死鳥': [['mem_pain',1]], '遺忘之島飛龍': [['mem_pain',0.5]], '魔狼': [['mem_pain',0.1]], '獨眼巨人': [['mem_pain',0.1]], '殘暴的史巴托': [['mem_pain',0.1]], '恐怖的地獄犬': [['mem_pain',0.1]],
    '思克巴': [['mem_pain',0.1],['mem_cube_harmony',0.25]],            // 疼痛 + 立方和諧
    // 幻覺：化身 mem_avatar
    '不死的木乃伊王': [['mem_avatar',2]], '古代巨人': [['mem_avatar',1]], '巨人': [['mem_avatar',0.3]], '巨人戰士': [['mem_avatar',0.3]], '巨人長老': [['mem_avatar',0.3]], '地獄奴隸': [['mem_avatar',0.25]],
    // 立方：和諧 mem_cube_harmony
    '暗黑思克巴女皇': [['mem_cube_harmony',1.5]], '深淵水靈': [['mem_cube_harmony',1.5]], '深淵火靈': [['mem_cube_harmony',1.5]], '水靈之主': [['mem_cube_harmony',0.8]], '火靈之主': [['mem_cube_harmony',0.8]], '思克巴女皇': [['mem_cube_harmony',0.25]],
    // 🌑 v3.3.33 黑暗妖精聖地：食腐獸 → 記憶水晶(立方：地裂) 0.5%（地獄奴隸的 mem_avatar 0.25% 本表原有）
    '食腐獸': [['mem_cube_quake',0.5]]
};
// 🔒 試煉兌換道具 → 限定職業：列在 MOB_DROPS 內的「各職業試煉交付/兌換道具」僅該職業擊殺才會掉（非本職直接跳過、也不顯示於掉落表）。
//    龍騎士的試煉道具走 DRAGON_DROPS 表本身已限定 dragon，故不列於此。掛點：killMob 的 MOB_DROPS 迴圈 + _auditMobDrops 顯示，皆呼叫 trialDropBlocked()。
const TRIAL_ITEM_CLASS = {
    // === 🛡️ 騎士試煉 ===
    'new_item_198': 'knight', 'new_item_196': 'knight', 'new_item_206': 'knight',   // 瑞奇：黑騎士的誓約／古老的交易文件／龍龜甲 → 紅騎士頭巾
    'new_item_144': 'knight',                                                        // 甘特：夏洛伯之爪 → 紅騎士之劍
    'new_item_208': 'knight',                                                        // 甘特：蛇女之鱗 → 紅騎士盾牌
    'item_nightvision': 'knight',                                                    // 馬沙(騎士)：夜之視野（+古代鑰匙）→ 勇敢皮帶
    'mat_flame_sword': 'knight',                                                     // 50 級試煉：炎魔之劍
    // === 🔮 法師試煉 ===
    'new_item_204': 'mage', 'new_item_205': 'mage', 'new_item_203': 'mage',          // 詹姆：食屍鬼的指甲／牙齒／骷髏頭 → 魔法能量之書
    'new_item_214': 'mage', 'new_item_212': 'mage',                                  // 水晶試煉：不死族的鑰匙／不死族的骨頭 → 水晶魔杖
    'new_item_240': 'mage',                                                          // 瑪那試煉：變形怪的血 → 瑪那魔杖／斗篷
    'mat_flame_eye': 'mage',                                                         // 50 級試煉：炎魔之眼（法師·原炎魔之心已改為此；炎魔之心改列王族）
    // === 🏹 妖精試煉 ===
    'new_item_199': 'elf', 'new_item_200': 'elf', 'new_item_201': 'elf', 'new_item_202': 'elf',   // 歐斯：四大妖魔魔法書（都達瑪拉/那魯加/甘地/阿吐巴）→ 精靈頭盔
    'new_item_213': 'elf',                                                           // 迷幻森林之母：受詛咒的精靈書
    'item_blueflute': 'elf',                                                         // 馬沙(妖精)：藍色長笛（+古代鑰匙）→ 保護者手套／精靈水晶
    'mat_flame_claw': 'elf',                                                         // 50 級試煉：炎魔之爪
    // === 🛡️🏹 騎士＋妖精 共用（馬沙：兩職皆需古代鑰匙）===
    'item_ancientkey': ['knight', 'elf'],
    // === 🗡️ 黑暗妖精試煉（倫得/康/布魯迪卡 影子裝備 + 50 級試煉墮落鑰匙）===
    'item_fallen_key': 'dark', 'item_death_oath': 'dark', 'item_orc_elder_head': 'dark', 'item_yeti_head': 'dark',
    // === 🎭 幻術士試煉（希蓮恩 + 50 級試煉翼龍之血）===
    'item_ant_fruit': 'illusion', 'item_ant_branch': 'illusion', 'item_ant_bark': 'illusion',
    'item_elmore_heart': 'illusion', 'item_time_orb': 'illusion', 'item_wyvern_blood': 'illusion',
    // === 🐉 龍騎士試煉道具（普洛凱爾兌換）===　DRAGON_DROPS 表 2026-06 改為「全職可掉」(書板/鎖鏈劍·就算不能裝備也掉)，故這 4 個試煉道具改列此表、靠 trialDropBlocked 維持「僅 dragon 才掉/看到」
    'item_demon_search': 'dragon', 'item_demon_spy': 'dragon', 'item_yeti_heart': 'dragon', 'item_soulfire_ash': 'dragon',
    // === ⚔️ 戰士試煉（多文兌換道具：僅戰士擊殺才掉、才顯示於掉落表）===
    'new_item_207': 'warrior', 'new_item_226': 'warrior', 'new_item_225': 'warrior', 'new_item_219': 'warrior', 'item_cyclops_blood': 'warrior', 'new_item_234': 'warrior',
    // === 👑 王族試煉（甘特：村民的遺物／馬沙：失去光明的靈魂／迪嘉勒廷 50 試煉：炎魔之心 → 黃金權杖）===
    'new_item_197': 'royal', 'new_item_211': 'royal', 'item_lost_soul': 'royal', 'mat_flame_heart': 'royal'   // 🔧 v3.0.80 搜索狀(new_item_197)＝王族15試煉道具（黑騎士搜索隊掉·接取制）
};
// 值可為「單一職業字串」或「職業陣列」（古代鑰匙＝騎士+妖精共用）。非允許職業擊殺則略過掉落、也不顯示於掉落表。
function trialDropBlocked(id) {
    if (typeof TRIAL_ITEM_CLASS === 'undefined') return false;
    let owner = TRIAL_ITEM_CLASS[id]; if (!owner) return false;
    if (typeof player === 'undefined') return false;
    let mainClassOk = Array.isArray(owner) ? owner.indexOf(player.cls) !== -1 : player.cls === owner;
    // 🔥 接取制試煉：主玩家或任一參戰隊員符合職業、已接取且尚未集滿，才保留掉落判定。
    if (mainClassOk && (typeof trialItemActive !== 'function' || trialItemActive(id))) return false;
    if (typeof allyTrialItemActive === 'function' && allyTrialItemActive(id)) return false;
    return true;
}
// 🔧 三階黑暗精靈水晶掉落表（怪物名稱 → [[水晶ID, 機率%], ...]；於擊殺結算套用，受席琳世界 _dropMult 影響）
// bk_dark_fang=暗影之牙 / bk_dark_dodge=暗影閃避 / bk_dark_crit=會心一擊 / bk_dark_erup=迴避提升 / bk_dark_double=雙重破壞 / bk_dark_armorbreak=破壞盔甲
const DARK_CRYSTAL_DROPS = {
    // 暗影之牙
    '亞力安':     [['bk_dark_fang',0.1]],
    '地獄犬':     [['bk_dark_fang',0.01]],
    '蟑螂人':     [['bk_dark_fang',0.01]],
    '變形怪首領': [['bk_dark_fang',1]],
    '死亡騎士':   [['bk_dark_fang',2],['bk_dark_armorbreak',1]],   // 暗影之牙 + 破壞盔甲
    // 暗影閃避
    '冰人':       [['bk_dark_dodge',0.1]],
    '人魚':       [['bk_dark_dodge',0.01]],
    '鼠人':       [['bk_dark_dodge',0.1]],
    '阿魯巴':     [['bk_dark_dodge',0.5]],
    // 會心一擊
    '獨眼巨人':   [['bk_dark_crit',0.5]],
    '密密':       [['bk_dark_crit',0.3]],
    '冰原老虎':   [['bk_dark_crit',0.2]],
    '冰之女王':   [['bk_dark_crit',2]],
    // 迴避提升
    '蛇女':       [['bk_dark_erup',0.03]],
    '多眼怪':     [['bk_dark_erup',0.1]],
    '夢幻之島閃電球': [['bk_dark_erup',0.3]],   // 對應玩家所指「閃電球」
    '夢幻之島風精靈王':   [['bk_dark_erup',1]],
    '巨蟻女皇':   [['bk_dark_erup',3]],
    // 雙重破壞
    '火蜥蜴':     [['bk_dark_double',0.01]],
    '阿西塔基奧': [['bk_dark_double',0.05]],
    '死神':       [['bk_dark_double',0.1]],
    '邪惡蜥蜴':   [['bk_dark_double',0.2]],
    '巴列斯':     [['bk_dark_double',3]],
    '飛龍':       [['bk_dark_double',1]],
    // 破壞盔甲（死亡騎士見上方）
    '巴風特':     [['bk_dark_armorbreak',1]],
    '安塔瑞斯':   [['bk_dark_armorbreak',5]]
};
// 脆弱（白鳥5）：受所有來源傷害 +10%
function fragileMult(t) {
    let m = 1;
    if (t && t.st) { if (t.st.fragile > 0) m *= 1.1; if (t.st.armorbreak > 0) m *= 1.58; }
    // 👑 精準目標：場上所有敵人受傷 +[1+(施放者等級/15)]%（🏅 血盟精通→/10）。v2.7.92 修稽核：王族「傭兵」施放的也生效——隊長優先、否則取第一個有此 buff 的傭兵（不疊加·單一來源）；v2.6.50 維持閘本就讓傭兵只在隊長沒開時補位＝互補
    let _pp = null;
    if (typeof player !== 'undefined' && player) {
        if (player.buffs && player.buffs.sk_royal_precise > 0) _pp = player;
        else if (player.allies) { for (let _a of player.allies) { if (_a && !_a._downed && _a.buffs && _a.buffs.sk_royal_precise > 0) { _pp = _a; break; } } }
    }
    if (_pp) { let _div = (_pp.mastery === 'k_royal_pledge') ? 10 : 15; m *= (1 + (1 + (_pp.lv || 1) / _div) / 100); }
    return m;
}   // 🔮 脆弱(白鳥5)+10%、🔧 破壞盔甲+58%；👑 精準目標（隊長或傭兵擇一）

// ============================================================================
// 🏅 職業精通系統（威頓村 NPC 漢，Lv50+）
//  流程：接取任務 → 擊敗職業對應頭目必得「精通之證」（身上已有則不再掉）→ 回威頓村交付 →
//        開啟精通選擇。初次選擇免費，之後每次更換固定 300 萬金幣。
//  狀態：player.masteryQuest = null|'active'|'done'；player.mastery = 精通id|null；player.masteryChangeCnt = 已付費更換次數
// ============================================================================
const MASTERY_DATA = {
    knight: { logo: 'assets/logo/騎士logo.png', boss: '飛龍', list: {
        k_counter: { n: '反擊精通', pos: 'top',    msg: '將反擊與居合磨鍊至極致',       d: '洞悉敵人的攻勢，以必殺的反擊與居合斬破要害，連堅硬外皮也會在劍鋒下崩解。' },
        k_cleave:  { n: '切割精通', pos: 'left',   msg: '切割架勢常駐，攻勢更加凌厲',           d: '完全掌握切割武器的重心，使迅捷的連斬與沉重的猛擊自然銜接。' },
        k_pierce:  { n: '穿透精通', pos: 'right',  msg: '穿透變全體攻擊、無視硬皮',                     d: '使用有穿透的武器時，穿透效果變成全體攻擊，且穿透傷害無視硬皮減傷' },
        k_survive: { n: '生存精通', pos: 'bottom', msg: '強化治癒藥水與魔法抵抗',             d: '久經死戰的騎士更能發揮治癒藥水的效力，也更能抵擋敵人的魔法。' }
    } },
    mage: { logo: 'assets/logo/法師logo.png', boss: '飛龍', list: {
        m_resonance: { n: '共鳴精通', pos: 'top',    msg: '共鳴之光穿透魔法防護',           d: '使魔杖的共鳴化為純粹光箭，穿透魔法防護並將造成的傷害轉回自身魔力。' },
        m_strike:    { n: '魔擊精通', pos: 'left',   msg: '魔擊向四周擴散',         d: '魔擊爆發時會向戰場擴散；共鳴與魔爆武器也能引動同樣的魔力衝擊。' },
        m_echo:      { n: '迴響精通', pos: 'right',  msg: '傷害法術有機率變成連發、單體加倍',             d: '施放傷害攻擊法術時，有機率不消耗MP立刻觸發相同法術；全體傷害魔法沿用原機率，單體傷害魔法觸發機率加倍' },
        m_summon:    { n: '召喚精通', pos: 'bottom', msg: '強化迷魅與召喚眷屬', d: '低階魔物難以抗拒迷魅術；由造屍術與召喚術喚來的眷屬也會變得更強、更精準，並更頻繁地施展天賦能力。' }
    } },
    elf: { logo: 'assets/logo/妖精logo.png', boss: '飛龍', list: {
        e_rapid:  { n: '連射精通', pos: 'top',    msg: '連射更強，箭勢更加密集',                   d: '將風的律動融入弓弦，使每次連射都能放出更多、更具威力的箭矢。' },
        e_spirit: { n: '精靈精通', pos: 'left',   msg: '呼喚元素精靈王降臨',     d: '與元素締結最高階的契約，使強力精靈昇華為精靈王；精靈王能以同屬性的強大法術席捲敵陣。' },
        e_sword:  { n: '劍術精通', pos: 'right',  msg: '掌握騎士劍術並發動看破',         d: '學會駕馭騎士的單手武器，以迅捷劍勢貼近敵人，並在交鋒中看破其弱點。' },
        e_magic:  { n: '魔導精通', pos: 'bottom', msg: '深化屬性魔法並研習高階法術',     d: '與自身元素共鳴，降低同屬性魔法的負擔，並開啟研習高階元素法術的道路。' }
    } },
    dark: { logo: 'assets/logo/黑暗妖精logo.png', boss: '飛龍', list: {
        d_poison: { n: '劇毒精通', pos: 'top',    msg: '使附加劇毒更致命',     d: '將席琳的劇毒深植兵刃，使每次淬毒攻擊都留下猛烈而持續的傷害。' },
        d_bleed:  { n: '出血精通', pos: 'left',   msg: '雙刀亦能撕裂傷口',     d: '精通以匕首與雙刀撕裂要害，連續命中會讓傷口惡化，流血不止。' },
        d_crit:   { n: '爆擊精通', pos: 'right',  msg: '更易命中要害並乘勢追擊',       d: '無論近戰或遠攻都能準確捕捉破綻，擊中要害後立刻乘勢追加攻擊。' },
        d_evade:  { n: '迴避精通', pos: 'bottom', msg: '承受攻勢後伺機閃避反殺',     d: '在敵人的連續攻勢中逐漸看清其動作；成功閃避後，下一擊將準確命中要害。' }
    } },
    illusion: { logo: 'assets/logo/幻術士logo.png', boss: '飛龍', list: {
        i_qigu:       { n: '奇古獸精通', pos: 'top',    msg: '奇古獸之力穿透魔法防護',         d: '與奇古獸完全同步，使攻擊與奇異能力不再受魔法防護阻隔，出手也更加迅捷。' },
        i_magicsword: { n: '魔劍精通',   pos: 'left',   msg: '將近戰兵刃化為魔力媒介', d: '以魔杖之外的近戰武器承載奇古獸之力，使斬擊化為精準的魔法傷害，並提升攻勢。' },
        i_illusion:   { n: '幻術精通',   pos: 'right',  msg: '幻覺法術召喚幻象並肩作戰',               d: '施放特定幻覺法術（幻覺：歐吉／巫妖／鑽石高崙）時，產生對應的召喚幻象一同戰鬥（需習得對應記憶水晶法術）' },
        i_mana:       { n: '魔力精通',   pos: 'bottom', msg: '擴張魔力並與傭兵共享',             d: '大幅擴張幻術士的魔力容器，代價是法術更為沉重；施法時逸散的魔力會流向同行的傭兵。' }
    } },
    dragon: { logo: 'assets/logo/龍騎士logo.png', boss: '飛龍', list: {
        k_awaken:      { n: '覺醒精通', pos: 'top',    msg: '同時承受多種龍之覺醒',           d: '讓龍騎士的血脈容納多種龍之覺醒，並進一步激發覺醒時的戰鬥速度。' },
        k_chainblade:  { n: '鎖刃精通', pos: 'left',   msg: '迅速累積弱點並強化屠宰者',   d: '鎖鏈劍能接連揭露敵人的弱點，屠宰者會利用每一道破綻造成更沉重的傷害。' },
        k_weakness:    { n: '弱點精通', pos: 'right',  msg: '所有近戰皆可揭露弱點',       d: '任何近戰兵刃都能撕開敵人的防勢，使後續攻擊更易命中，且屠宰者不再抹去既有破綻。' },
        k_dragonblood: { n: '龍血精通', pos: 'bottom', msg: '降低龍魔法代價並強化治癒',                 d: '淬鍊體內龍血，減輕施展龍魔法時的生命代價，也能更充分吸收治癒藥水。' }
    } },
    warrior: { logo: 'assets/logo/戰士logo.png', boss: '飛龍', list: {
        k_giantaxe: { n: '巨斧精通', pos: 'top',    msg: '以單手駕馭沉重巨斧',          d: '以驚人腕力單手揮舞原本需雙手持用的鈍器，精通迅猛雙斧後更能雙持巨兵。' },
        k_dualaxe:  { n: '雙斧精通', pos: 'left',   msg: '強化雙持、投斧與出血', d: '戰斧投擲不再消耗魔力，撕裂的傷口也更加嚴重；雙持鈍器時攻勢更為迅猛。' },
        k_rebound:  { n: '反彈精通', pos: 'right',  msg: '更早喚醒忍耐並立即反攻',             d: '戰況轉危時便能喚醒忍耐之力，每次承受住致命攻勢，都會立即向敵人還以猛擊。' },
        k_tough:    { n: '堅韌精通', pos: 'bottom', msg: '危境中強化治癒與護甲',               d: '瀕臨危境時能更充分吸收治癒藥水，護甲身軀也能卸去更多傷害。' }
    } },
    royal: { logo: 'assets/logo/王族logo.png', boss: '飛龍', list: {
        k_royal_pet:    { n: '夥伴精通', pos: 'top',    msg: '王者威儀鍛鑄不屈的夥伴', d: '出戰寵物的最終傷害與命中皆提升 50%（×1.5），且受到的傷害減少 50%（持續傷害為固定真傷，不受此減免）。魅力仍照常提供寵物傷害與命中；傭兵沿用各自的王族鼓舞效果，不受此精通影響。' },
        k_royal_pledge: { n: '血盟精通', pos: 'left',   msg: '減輕號令負擔並強化精準目標',           d: '呼喚盟友時消耗較少魔力；精準目標會隨王族的歷練成長，使全體盟友更容易重創敵人。' },
        k_royal_sword:  { n: '劍術精通', pos: 'right',  msg: '強化王族劍術與勇猛意志',           d: '持單手劍或雙手劍時展現王族劍術，攻勢更加迅捷，也更容易喚醒勇猛意志。' },
        k_royal_magic:  { n: '魔法精通', pos: 'bottom', msg: '研習法師魔法並以劍引術',       d: '開啟研習中階法師魔法的道路；一般攻擊命中時，偶爾能不耗魔力地引發設定中的攻擊法術。' }
    } }
};
const MASTERY_POS_STYLE = {   // 四向按鈕四色（上紅/左藍/右紫/下綠）
    top:    'bg-red-950/80 border-red-500 hover:bg-red-900',
    left:   'bg-blue-950/80 border-blue-500 hover:bg-blue-900',
    right:  'bg-purple-950/80 border-purple-500 hover:bg-purple-900',
    bottom: 'bg-emerald-950/80 border-emerald-500 hover:bg-emerald-900'
};
const MAGIC_MASTERY_SKILLS = ['sk_blizzard', 'sk_tornado', 'sk_quake', 'sk_fire_storm'];   // 魔導精通可學的法師法術
function hasMastery(id) { return !!(player && player.mastery === id); }
function allyHasMastery(ally, id) { return !!(ally && ally.mastery === id); }   // 🔧 傭兵吃「自身存檔」的精通（不吃主玩家精通）
function repairMasteryState(p) {
    let result = { changed: false, reset: false, reason: null };
    if (!p || typeof p !== 'object') return result;

    let reset = reason => {
        p.masteryQuest = null;
        p.mastery = null;
        p.masteryChangeCnt = 0;
        result.changed = true;
        result.reset = true;
        result.reason = reason;
    };
    let hasSavedMastery = p.mastery != null || p.masteryQuest != null || Number(p.masteryChangeCnt) > 0;

    // 經典模式不開放精通；清除舊版刪角殘留或外部匯入的不合法狀態。
    if (p.classicMode) {
        if (hasSavedMastery) reset('classic-mode');
        return result;
    }

    let md = MASTERY_DATA[p.cls];
    if (!md || !md.list) {
        if (hasSavedMastery) reset('unknown-class');
        return result;
    }

    // v3.7.73 前，刪角後不重整便創角會沿用上一角色的 player 物件。
    // 新職業因此可能帶著舊職業精通 ID，渲染／切換時存取 md.list[舊ID] 而中斷。
    if (p.mastery != null && !Object.prototype.hasOwnProperty.call(md.list, p.mastery)) {
        reset('class-mismatch');
        return result;
    }

    let validQuest = p.masteryQuest === null || p.masteryQuest === 'active' || p.masteryQuest === 'done';
    if (!validQuest) {
        p.masteryQuest = p.mastery == null ? null : 'done';
        result.changed = true;
        result.reason = 'invalid-quest';
    } else if (p.mastery != null && p.masteryQuest !== 'done') {
        // 已有合法精通代表任務必定完成；保護很早期缺 masteryQuest 的合法存檔。
        p.masteryQuest = 'done';
        result.changed = true;
        result.reason = 'missing-completion';
    }

    let count = Math.max(0, Math.floor(Number(p.masteryChangeCnt) || 0));
    if (p.mastery == null) count = 0;
    if (p.masteryChangeCnt !== count) {
        p.masteryChangeCnt = count;
        result.changed = true;
        if (!result.reason) result.reason = 'invalid-change-count';
    }
    return result;
}
// 🌟 v3.0.99 隊長團隊光環：任一隊員(玩家或未倒地傭兵)維持該 buff 即全隊生效。清單供「傭兵可維持/隊伍面板可開關/避免重複施放」使用。
//   ⚠️不含完全免疫類(絕對屏障/大地屏障/魔法屏障·刻意不給傭兵)。golem/ogre/lich 為幻術幻象召喚(illuSummon)·此處僅列其「光環」由玩家提供·傭兵暫不維持(見 _isMercSelfBuff)。
const TEAM_AURA_SKILLS = ['sk_elf_earthbless', 'sk_royal_burnweapon', 'sk_royal_shield', 'sk_elf_dancefire'];   // 傭兵可維持的團隊光環（大地祝福AC-7·灼熱武器傷害/命中+5·閃亮之盾AC-8·🔥v3.8.3 舞躍之火近距離傷害+3）。任一來源施放一次即惠及玩家、傭兵、寵物與召喚物，同技能不重複疊加。鋼鐵防護為施法者自身 AC-10，不列入團隊光環。⚠️v3.4.45 水之元氣/化身已改「單體共享」(TEAM_SHARE_BUFFS)→移出此清單。⚠️此陣列＝唯一註冊點（勿在 DB.skills 加 teamAura 旗標·無人讀取）。
// 🤝 v3.4.45 單體輔助共享清單：施法者(玩家/傭兵)自己有清單內 buff、隊友沒有 → 由 shareTeamBuffs(js/06) 一次補滿所有缺者(逐一扣施法者 MP)。與「自動維持勾選」解耦(只看清單＋是否持有)。
//   ⚠️其中原為全隊光環者(幻覺歐吉/巫妖/鑽石高崙/化身·水之元氣)已於本版改單體：移出 TEAM_AURA_SKILLS＋teamIlluAura/teamAcBonus/teamDmgReduceMult 只對寵物/召喚保留(forMinion)；玩家/傭兵改各自持有(recompute d)＋此共享逐人補。
const TEAM_SHARE_BUFFS = new Set(['sk_holy_wpn', 'sk_dex_up', 'sk_haste_spell', 'sk_greater_haste', 'sk_bless_wpn', 'sk_str_up', 'sk_holy_barrier', 'sk_illu_ogre', 'sk_illu_focus', 'sk_illu_lich', 'sk_illu_golem', 'sk_illu_avatar', 'sk_elf_watervital', 'sk_elf_windshot', 'sk_elf_earthshield', 'sk_elf_preciseshot', 'sk_elf_stormeye', 'sk_heal_energy_storm']);   // 🌀 v3.4.71 治癒能量風暴＝單體輔助共享（施法者有→幫缺的傭兵/玩家補·各自 320s 結束才再補）；v3.5.87 補強力加速術（漏列·原本「只有強力加速術」的施法者不分享加速）
// ⚠️ v3.4.45 暴風之眼(sk_elf_stormeye·+2遠傷/+2遠命)＝用戶要「一次施放全隊生效」：以自動共享達成（一位維持者→鋪給全隊玩家/傭兵·各自 recompute d 生效）。寵物/召喚未涵蓋（真．全隊 ranged 光環需改 8 個傷害熱點·邊際效益低·暫以共享代之）。
// 團隊光環是否有「任一隊員(排除 exclude)」維持中：exclude 傳「受益者本身」→其自身光環已由 recomputeStats 套進自身 d，避免與此 helper 雙算（僅對 recompute 有套進 d 的光環需排除·如 AC/攻擊）。
function _teamAuraHas(sid, exclude) {
    if (typeof player !== 'undefined' && player && player !== exclude && player.buffs && (player.buffs[sid] || 0) > 0) return true;
    let al = (typeof player !== 'undefined' && player && player.allies) || [];
    for (let i = 0; i < al.length; i++) { let a = al[i]; if (a && a !== exclude && !a._downed && a.buffs && (a.buffs[sid] || 0) > 0) return true; }
    return false;
}
function masteryChangeCost() { return { gold: 3000000 }; }   // 固定費用：每次更換都維持 300 萬金幣，不隨次數遞增
// 技能職業需求等級（單一事實來源）：🏅 魔導精通的妖精可學四項法師法術（需求等級沿用法師）
function skillReqLv(sk, skId) {
    if (player.cls === 'dark') {
        if (sk.reqD !== undefined) return sk.reqD;                                  // 黑暗妖精專屬魔法
        if (sk.reqM !== undefined && (sk.tier === 1 || sk.tier === 2)) return sk.tier === 1 ? 12 : 24;   // 基礎法師魔法：一階 Lv12 / 二階 Lv24（學不到精靈水晶與高階法師魔法）
        return undefined;
    }
    if (player.cls === 'illusion') return sk.reqI;   // 🔮 幻術士：只學帶 reqI 的法術（記憶水晶＋日光術）；undefined＝不可學（不再誤用 reqE）
    if (player.cls === 'dragon') return sk.reqDk;   // 🐉 龍騎士：只學帶 reqDk 的龍魔法（含日光術）；undefined＝不可學
    if (player.cls === 'warrior') {                  // ⚔️ 戰士：只學帶 reqW 的技能印記；另可在 Lv15 學一階法師魔法
        if (sk.reqW !== undefined) return sk.reqW;
        if (sk.reqM !== undefined && sk.tier === 1) return 15;
        return undefined;
    }
    if (player.cls === 'royal') {                    // 👑 王族：學帶 reqRoy 的王族魔法；另可在 Lv10/Lv20 學一/二階法師魔法（魔法精通可再學三~五階）
        if (sk.reqRoy !== undefined) return sk.reqRoy;
        if (sk.reqM !== undefined && sk.tier === 1) return 10;
        if (sk.reqM !== undefined && sk.tier === 2) return 20;
        if (player.mastery === 'k_royal_magic' && sk.reqM !== undefined && (sk.tier === 3 || sk.tier === 4 || sk.tier === 5)) return sk.reqM;   // 🏅 魔法精通：可學法師三~五階魔法
        return undefined;
    }
    let lv = player.cls === 'mage' ? sk.reqM : (player.cls === 'knight' ? sk.reqK : sk.reqE);
    if (lv === undefined && player.cls === 'elf' && player.mastery === 'e_magic' && skId && MAGIC_MASTERY_SKILLS.includes(skId)) lv = sk.reqM;
    return lv;
}
let _echoFree = false;        // 🏅 迴響精通：免費連發旗標（連發那次不耗MP、不再連鎖）
let _royalFreeCast = false;   // 👑 魔法精通：一般攻擊命中 10% 免MP額外施放選定攻擊技的旗標

let state = { running: false, ticks: 0, pDmgTick: 0, ff: false, ffSmall: false, inTick: false };
// 🗑️ v3.7.94 用戶指定移除離線掛機（js/27 整檔刪除）：現在只剩「網頁還開著」這一軌——
//    切分頁／縮小的背景期間由下方 Worker 心跳持續跑，被節流到的差額則於回前景時補幀補跑（state.ff 補跑重建）。
//    **真正關閉網頁＝進度完全停止**，重開不再有任何離線結算。
const TICK_MS = 100;                 // 一個邏輯 tick 代表的真實時間
const JUNK_AUTOSELL_TICKS = 100;    // 🗑️ 廢品自動賣出間隔：10 秒（100 tick × 100ms·2026-07-01 由 1800/3分鐘改快）；玩家手動標示廢品會把倒數重置為此值（標完 10 秒無新動作才賣）。⚠️自動賣出這條路徑不 saveGame(見 autoSellJunk)，靠其他既有存檔點落地
const MERC_EXP_SHARE = 0.5;          // ⚠️已停用：v3.7.62 起主玩家、未倒地傭兵與寵物各得完整經驗；常數只留給舊外部引用
// 🤝 Phase4：設為「全體」的怪物攻擊技能名（依 mag.skn 比對·同名全部生效）→ 同時打玩家＋全部非倒地傭兵。其餘怪物傷害/狀態魔法仍可依仇恨權重隨機打單一目標(玩家或某傭兵)。
const MOB_PARTY_AOE_SKILLS = new Set(['闇黑波動','毒霧','鐮刀波動','火焰之舞','燃燒的火球','火焰之陣','地面震裂','跳躍波動','冰雪暴','震裂術','咆哮','燃燒立方','火焰噴吐','流星雨','火牢','寒冰噴吐','巨水炮','大地怒吼','毒氣風暴','閃電風暴','火焰雨','寒冰吐息','地獄犬噴吐','火風暴','龍捲風','爆炎的火球','噴火','漩渦','防身電擊','震裂踏擊','火焰放射','黑霧','火焰氣息','黑暗流星雨','放射斬','迴旋鞭打','衝擊波動','千刃破軍','靈魂波動','火焰爆發','迴旋斬','龍的一擊','地獄火','黑魔法力場','鐮刀劍氣斬','腐蝕之血','冰錐流星雨','水氣爆裂','集體衝暈','巨石爆裂','地面障礙','邪靈之氣','血夜月彎刀','夜魔飛襲','幻象光線','集體相消','劇毒龍捲風','麻痺蜘蛛網','雷霆風暴','沙塵暴','震裂重擊','冰雪颶風','衝擊之暈','岩漿流星雨','火焰散落','鎌鼬旋風','寒冰氣息','妖狐之火','牛鬼突進','大地崩裂','幽魂怨念','枯竭詛咒','屬性噴吐','劇毒噴吐','毀滅隕石']);   // 🐍 提卡爾杰弗雷庫雙BOSS 全體技能；🌑 v3.3.33 聖地；🌅 枯竭詛咒對每位玩家/傭兵各自以 MR 判定藥水霜化；🐉 v3.7.57 安塔瑞斯副本全體技（與 js/00 PARTY_AOE_SKILLS 同步）
let _loopLast = null;                // 上次主迴圈時間戳 (performance.now)
let _tickDebt = 0;                   // 尚待逐 tick 真實補跑的時間債務（含切分頁／縮小的背景時間）
let _ffSavePending = false;          // 補跑期間收到的存檔要求：還清後只補存一次，避免半套進度覆蓋 checkpoint
let _gameLoopId = null;              // 主迴圈 setInterval id（用於避免重複註冊）
let _saveLoopId = null;             // 自動存檔 setInterval id
let currentSlot = 1;                // 目前所在的存檔位（1~4）

function catchupActive() {
    return !!(state && (state.ff || _tickDebt >= TICK_MS));
}

function deferCatchupSave() {
    _ffSavePending = true;
    return false;
}

function takeCatchupSaveRequest() {
    let pending = _ffSavePending;
    _ffSavePending = false;
    return pending;
}

function catchupPendingMs() {
    return Math.max(0, Number(_tickDebt) || 0);
}

function queueCatchupMs(ms) {
    ms = Number(ms);
    if (!Number.isFinite(ms) || ms <= 0 || !state || !state.running || !player || !player.cls || player.dead) return false;
    _loopLast = _perfNow();
    _tickDebt += ms;
    if (typeof _ffScheduleNext === 'function') _ffScheduleNext();
    return true;
}

// 背景分頁回前景：把整段時間排入真實 tick 補跑；分批執行以維持畫面可操作。
function settleBackgroundMs(ms, reason) {
    ms = Math.max(0, Number(ms) || 0);
    if (ms < TICK_MS) return true;
    if (queueCatchupMs(ms)) return true;
    if (typeof logSys === 'function') {
        logSys('<span class="text-red-400 font-bold">掛機補跑排程失敗，本次未進行補跑，請重新整理後再試。</span>');
    }
    return false;
}

// 統一啟動遊戲計時器：先清除既有的，再重新註冊，確保整個工作階段只會有一組計時器
function startGameTimers() {
    if (typeof _ffCancelScheduledLoop === 'function') _ffCancelScheduledLoop();
    if (_gameLoopId !== null) clearInterval(_gameLoopId);
    if (_saveLoopId !== null) clearInterval(_saveLoopId);
    _loopLast = null; _tickDebt = 0; _ffSavePending = false;
    _ffHiddenAt = (typeof document !== 'undefined' && document.hidden) ? _perfNow() : 0;   // 🔀 遊戲啟動當下重新錨定（背景分頁裡載入的話，不把載入前的時間算進補跑）
    _gameLoopId = setInterval(gameLoop, 100);
    _saveLoopId = setInterval(saveGame, 300000); // 每 5 分鐘自動存檔
    if (typeof initCombatLogLock === 'function') initCombatLogLock();   // 🔒 綁定戰鬥日誌捲動鎖定（含去重）
    if (typeof initSysLogLock === 'function') initSysLogLock();         // 🔒 綁定系統與物品日誌捲動鎖定（含去重）
    if (typeof applyCombatFilter === 'function') applyCombatFilter();   // ⚔️ 套用已儲存的戰鬥日誌來源過濾（按鈕點亮/點暗 + 隱藏對應訊息）
    if (typeof _initTabGuard === 'function') _initTabGuard();           // 🚀 綁定分頁面板點擊保護＋重繪節流（避免狩獵時 賣出/強化 按鈕卡頓、點擊失效）
}

function stopGameTimers() {
    if (typeof _ffCancelScheduledLoop === 'function') _ffCancelScheduledLoop();
    if (typeof resetCatchupForRoleSwitch === 'function') resetCatchupForRoleSwitch();
    if (_gameLoopId !== null) clearInterval(_gameLoopId);
    if (_saveLoopId !== null) clearInterval(_saveLoopId);
    _gameLoopId = null;
    _saveLoopId = null;
    _loopLast = null;
    _tickDebt = 0;
    _ffSavePending = false;
    _ffHiddenAt = 0;
}

function _perfNow() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
function _resetGameLoopClock() { if (typeof _ffCancelScheduledLoop === 'function') _ffCancelScheduledLoop(); _loopLast = _perfNow(); _tickDebt = 0; _ffSavePending = false; }
// 背景期間由被 Chrome 降頻後仍能執行的 gameLoop 先增量補跑；回前景只補最後一次 callback 後的剩餘差額。
// _loopLast 會在每次背景 gameLoop 更新，因此不能再用整段 hidden 時間入帳，否則會把已處理部分重複計算。
let _ffHiddenAt = (typeof document !== 'undefined' && document.hidden) ? _perfNow() : 0;
function _resumeIncrementalBackground(reason) {
    let _now = _perfNow();
    let _anchor = (Number.isFinite(_loopLast) && _loopLast > 0) ? _loopLast : _ffHiddenAt;
    _ffHiddenAt = 0;
    _loopLast = _now;
    if (_anchor > 0 && typeof state !== 'undefined' && state.running && typeof player !== 'undefined' && player && player.cls && !player.dead) {
        settleBackgroundMs(Math.max(0, _now - _anchor), reason);
    }
    // 若背景已完全追平而只剩摘要待結束，這次零差額 gameLoop 會負責統一重繪與顯示。
    if (typeof gameLoop === 'function') gameLoop();
}
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) { if (!_ffHiddenAt) _ffHiddenAt = _perfNow(); return; }
        _resumeIncrementalBackground('visibility');
    });
}
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('pageshow', function (ev) {
        // bfcache 完全凍結期間沒有 callback：以最後一次 gameLoop 為錨，只補尚未執行的尾段。
        if (ev && ev.persisted) {
            _resumeIncrementalBackground('bfcache');
            return;
        }
        _ffHiddenAt = 0;
        _resetGameLoopClock();
    });
}

// 🧵 v3.7.33 背景全速心跳：主執行緒計時器在背景分頁會被 Chrome 節流（最壞每分鐘一拍），
//    但 Web Worker 的計時器不受分頁節流影響——由 Worker 每秒 postMessage 喚醒主執行緒跑一次 gameLoop，
//    上方的背景增量補跑便以近即時速率持續執行：切分頁／縮小視窗也完整照跑不停止。
//    前景不走此路徑（100ms 主迴圈負責）；Worker 建立失敗時自動退回既有的節流喚醒＋回前景差額補跑。
//    file:// 下外部 Worker 檔會被擋，須用 Blob URL 建立。
//    ⚠️限制：分頁被瀏覽器整個凍結／丟棄（省電模式、記憶體回收）時 message 也不會送達，
//    該情境由回前景的差額補跑兜底（v3.7.94 起已無離線結算這條退路）。
let _bgHeartbeatWorker = null;
(function _initBgHeartbeat() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof Blob === 'undefined'
        || typeof URL === 'undefined' || !URL.createObjectURL) return;
    try {
        let _u = URL.createObjectURL(new Blob(['setInterval(function(){postMessage(1);},1000);'], { type: 'text/javascript' }));
        _bgHeartbeatWorker = new Worker(_u);
        URL.revokeObjectURL(_u);
        _bgHeartbeatWorker.onmessage = function () {
            if (typeof document === 'undefined' || !document.hidden) return;   // 前景由 100ms 主迴圈驅動
            if (typeof gameLoop !== 'function' || !state.running) return;
            gameLoop();
            // 背景中被延後的存檔（每 5 分鐘自動存檔會進 deferCatchupSave）：趁債務已還清的空檔補寫入，
            // 降低背景掛機中分頁被瀏覽器回收時的進度損失；js/27 的 checkpoint 凍結不受影響，仍錨在切出當下。
            if (_tickDebt < TICK_MS && takeCatchupSaveRequest() && typeof saveGame === 'function') {
                try { saveGame(); } catch (e) {}
            }
        };
    } catch (e) { _bgHeartbeatWorker = null; }
})();

let player = {
    cls: null, name: null, lv: 1, exp: 0, gold: 1000, hp: 0, mhp: 0, mp: 0, mmp: 0, alignmentValue: 0, pvpOn: false, pvpRevengeList: [], socialNpcContacts: [],
    base: { str:0, dex:0, con:0, int:0, wis:0, cha:8 }, bonus: 0, alloc: { str:0, dex:0, con:0, int:0, wis:0, cha:0 }, panacea: { str:0, dex:0, con:0, int:0, wis:0, cha:0 }, panaceaUsed: 0, junkPrefs: {}, bloodPledge: null, magicShieldCd: 0, lastMapByCat: {}, tracking: null, sherineWorld: false, masteryQuest: null, mastery: null, masteryChangeCnt: 0, siege: { active:false, city:'kent', gateKilled:false, towerKilled:false, endTime:0, kills:0, result:null, cooldownUntil:0, accCdUntil:0 },
    inv: [], eq: { wpn: null, arrow: null, helm: null, armor: null, shin: null, shield: null, cloak: null, tshirt: null, gloves: null, boots: null, ring1: null, ring2: null, ring3: null, ring4: null, amulet: null, ear1: null, ear2: null, belt: null, pet: null, doll: null },
    skills: [], buffs: { haste: 0, brave: 0, blue: 0, cautious: 0, elfcookie: 0, poly: 0, shield: 0, sk_magic_shield: 0 }, poly: null, allies: [],
    summon: null, charmed: null, manualCd: {}, elfEle: null, hots: {},   // 🔧 v3.5.94 同上：孤兒 hot(單數) → 休眠機制真正使用的 hots(複數 dict)
    cds: { pot: 0, atkSk: 0, healSk: 0, purifySk: 0, convertSk: 0 }, dead: false, statuses: { stun: 0, freeze: 0, stone: 0, poison: 0, poisonDmg: 0, poisonTick: 0, burn: 0, burnDmg: 0, burnTick: 0, scald: 0, scaldDmg: 0, scaldTick: 0, bleed: 0, bleedDmg: 0, bleedTick: 0, sleep: 0, silence: 0, paralyze: 0, magicseal: 0, armorBreak: 0, slowAtk: 0, cleave: 0, bind: 0 },   // 🕸️ v3.7.75 bind 束縛
    d: { str:0, dex:0, con:0, int:0, wis:0, cha:8,
         meleeDmg: 0, meleeHit: 0, meleeCrit: 0,           // 近距離（力量）
         rangedDmg: 0, rangedHit: 0, rangedCrit: 0,         // 遠距離（敏捷）
         extraDmg: 0, extraHit: 0,                          // 額外傷害 / 額外命中（同時影響遠近）
         magicDmg: 0, magicHit: 0, magicCrit: 0, extraMp: 0, mpReduce: 0, // 魔法（智力）
         meleeCritDmg: 50, rangedCritDmg: 50, magicCritDmg: 50,           // 爆擊傷害%
         ac: 10, mr: 0, er: 0, dr: 0,
         resFire: 0, resWater: 0, resEarth: 0, resWind: 0,  // 屬性抗性%
         hpRegenMax: 0, hpR: 0, mpR: 0, aspd: 1.0 }
};

let mapState = { current: "training", mobs: [null, null, null, null, null], targetIdx: 0 };   // 🆕 5 格（前排 0,1,2＋後排 3,4）

// 🧼 v3.7.73 「頁面剛載入」的原型快照＝新角色乾淨起點的單一真相。
//   背景：遊戲中按「返回角色選擇」不會重載頁面 → 全域 player／mapState 仍是上一個角色的物件；
//   而 startGame() 只逐欄覆寫其中一部分，沒被覆寫的欄位會整包被新角色繼承
//   （allies 傭兵／panacea+panaceaUsed 萬能藥／masteryQuest+mastery 精通／trialQ 試煉／deathLog／alignmentValue…）。
//   ⚠️ 刻意不套 applySaveDefaults()：目標就是「與重新整理後創角完全等價」，多補欄位反而偏離該基準。
const PLAYER_INIT_SNAPSHOT = JSON.stringify(player);
const MAPSTATE_INIT_SNAPSHOT = JSON.stringify(mapState);
function freshPlayerState() { return JSON.parse(PLAYER_INIT_SNAPSHOT); }
function freshMapState() { return JSON.parse(MAPSTATE_INIT_SNAPSHOT); }
let _mobBornSeq = 0;   // 🎯 全域單調遞增「出生序」（每隻怪生成時 +1；越小＝越早出生／在場上存活越久）→ getTarget 用來「優先打先出生的怪」
let createBase = { 
    knight: {str:16, dex:12, con:14, int:8, wis:9, cha:8, pts:8}, 
    mage: {str:8, dex:7, con:12, int:12, wis:12, cha:8, pts:16},
    elf: {str:11, dex:12, con:12, int:12, wis:12, cha:8, pts:8}, // 妖精基底（可分配8點
    dark: {str:12, dex:15, con:8, int:10, wis:11, cha:8, pts:11}, // 黑暗妖精基底（可分配11點，以0計）
    illusion: {str:11, dex:10, con:12, int:12, wis:12, cha:8, pts:10}, // 幻術士基底（可分配10點，以0計）
    dragon: {str:13, dex:11, con:14, int:11, wis:12, cha:8, pts:6}, // 龍騎士基底（可分配6點，以0計）
    warrior: {str:16, dex:13, con:16, int:10, wis:7, cha:8, pts:5}, // ⚔️ 戰士基底（可分配5點，以0計）
    royal: {str:13, dex:10, con:10, int:10, wis:11, cha:13, pts:8} // 👑 王族基底（可分配8點，以0計）
};
let curCreate = { rawCls: 'm_royal', cls: 'royal', str:0, dex:0, con:0, int:0, wis:0, cha:0 };

// 🚫 v3.2.17 舊項圈夥伴 PET_DEF 已移除——新夥伴系統唯一真相＝js/22-pets.js 的 PET_BOOK（39 型態·獨立等級/技能）。
// 🦴 寵物裝備加成（v3.2.37 個別裝備制）：讀「該寵物」p.eq.wpn 的之牙 → 額外傷害/命中（含強化：每+1 各+1，上限+5）；收集冊/遺物全體加成照舊
function petGearBonus(p) {
    let _collHit = (player._equipPetHit || 0);   // 🗡️ 裝備收集冊：寵物裝備部位全收集 → 寵物命中加成（不需裝備之牙也生效）
    // 🏺 遺物「所有寵物額外傷害/命中」：掃玩家＋未倒地傭兵全部裝備欄的 petDmgAll/petHitAll 加總（牧神的放牧棍 傷害+3；食人妖精王的尖刺項圈 傷害/命中各+3；武器/防具/腰帶皆生效）
    // 🩹 v3.2.42 稽核修：範圍與 _relicPetSkillMult（訓狗棒）一致——傭兵持有也生效（原本只掃玩家·同類遺物範圍不一）
    let _allDmg = 0, _allHit = 0;
    let _scanPA = function (c) { if (!c || !c.eq) return; for (let _k in c.eq) { let _e = c.eq[_k]; if (!_e) continue; let _dd = DB.items[_e.id]; if (_dd && _dd.petDmgAll) _allDmg += _dd.petDmgAll; if (_dd && _dd.petHitAll) _allHit += _dd.petHitAll; } };
    _scanPA(player); (player.allies || []).forEach(function (a) { if (a && !a._downed) _scanPA(a); });
    let inst = p && p.eq && p.eq.wpn;
    let d = inst ? DB.items[inst.id] : null;
    if(!inst || !d) return { dmg:_allDmg, hit:_collHit + _allHit };
    let en = capEn(inst.en || 0, d);   // 上限 +5
    return { dmg: (d.petDmg || 0) + en + _allDmg, hit: (d.petHit || 0) + en + _collHit + _allHit };
}
// 🐾 召喚物裝備加成（喚獸師的訓練鞭 summonDmg/summonHit）：掃 owner(玩家或傭兵) 全部裝備欄加總，餵給 summonAttack 的命中/傷害。
function summonGearBonus(owner) {
    let o = owner || player, dmg = 0, hit = 0;
    if (o && o.eq) { for (let k in o.eq) { let e = o.eq[k]; if (!e) continue; let d = DB.items[e.id]; if (d && d.summonDmg) dmg += d.summonDmg; if (d && d.summonHit) hit += d.summonHit; } }
    return { dmg: dmg, hit: hit };
}
// 🏺 遺物屬性洞察（巨大螞蟻的複眼）：屬性名/色對照＋掃玩家裝備欄是否含 showMobEle（怪卡顯示敵人屬性）。
const RELIC_ELE_LABEL = { fire: '火', water: '水', earth: '地', wind: '風' };
const RELIC_ELE_COLOR = { fire: '#fca5a5', water: '#7dd3fc', earth: '#fcd34d', wind: '#86efac' };
function _relicShowMobEle() {
    if (!player || !player.eq) return false;
    for (let k in player.eq) { let e = player.eq[k]; if (e) { let d = DB.items[e.id]; if (d && d.showMobEle) return true; } }
    return false;
}
// 🏺 遺物「以敵人弱點屬性攻擊命中→額外固定傷害」（複眼 weakHitBonus）：掃 entity(玩家/傭兵) 全部裝備欄加總。
function _relicWeakHitBonus(entity) {
    let o = entity || player; if (!o || !o.eq) return 0; let s = 0;
    for (let k in o.eq) { let e = o.eq[k]; if (e) { let d = DB.items[e.id]; if (d && d.weakHitBonus) s += d.weakHitBonus; } }
    return s;
}
// 🚫 v3.2.17 petProcSpellDamage／petCollarCount／totalCollarCount 已隨舊項圈夥伴系統移除（新寵物技能傷害於 js/22 petCastSkill 自行結算）。

function uid() { return Math.random().toString(36).substr(2, 9); }
function roll(n, s) { let res = 0; for(let i=0; i<n; i++) res += Math.floor(Math.random() * s) + 1; return res; }

// 👇 新增這段：自動對照並產生對應素材路徑的函數
function getIconUrl(d, isSkill = false) {
    if (d.img) return d.img; // 如果資料庫有手動寫 img 網址，以它優先
    
    if (isSkill) return `assets/icons/skills/${d.n}.png`;
    
    if (d.type === 'wpn') return `assets/icons/weapons/${d.n}.png`;       // 武器
    if (d.type === 'arm') return `assets/icons/armors/${d.n}.png`;        // 防具
    if (d.type === 'acc') return `assets/icons/accessories/${d.n}.png`;   // 飾品
    
    return `assets/icons/items/${d.n}.png`;                               // 其他消耗品與道具
}

// ===== 能力換算輔助函數（依照「職業與基本設定」完整對照表）=====
// 通用：依「門檻->數值」的階梯表查值（門檻為該級距上限）
function lookupStep(val, table, def) {
    for (let i = 0; i < table.length; i++) {
        if (val <= table[i][0]) return table[i][1];
    }
    return def;
}

// ---------- 力量 STR：近距離傷害 / 近距離命中 / 近距離爆擊率 ----------
function getStrMeleeDmg(str) {
    return lookupStep(str, [
        [7,1],[9,2],[11,3],[13,4],[15,5],[17,6],[19,7],[21,8],[23,9],[24,10],
        [25,11],[27,12],[29,13],[31,14],[33,15],[34,16],[35,17],[37,18],[39,19],
        [41,20],[43,21],[44,22],[45,25],[47,26],[49,27],[51,28],[53,29],[55,30],
        [57,31],[59,32],[60,33],[62,34],[64,35],[65,36],[67,37],[69,38],
        [70,40],[72,41],[74,42],[76,43],[78,44],
        [80,45],[82,46],[84,47],[85,48],[87,49],[89,50],[90,52],[92,53],[94,54],[96,55],[98,56]
    ], 57); // …77~78=+44；79~80=+45；81~82=+46…（81~100 依 60→80 段曲線鏡射拓展·90 跳階+2）…97~98=+56；99~100=+57
}
function getStrMeleeHit(str) {
    return lookupStep(str, [
        [7,4],[8,5],[10,6],[11,7],[13,8],[14,9],[16,10],[17,11],[19,12],[20,13],
        [22,14],[23,15],[24,16],[25,17],[26,18],[28,19],[29,20],[31,21],[32,22],
        [34,23],[35,25],[37,26],[38,27],[40,28],[41,29],[43,30],[44,31],[46,35],
        [47,36],[49,37],[50,38],[52,39],[53,40],[55,41],[56,42],[58,43],[59,44],
        [60,45],[62,46],[64,47],[65,48],[67,49],[69,50],
        [71,51],[72,52],[73,53],[74,54],[75,55],[76,56],[77,57],[78,58],[79,59],
        [80,60],[82,61],[84,62],[85,63],[87,64],[89,65],[91,66],[92,67],[93,68],[94,69],[95,70],[96,71],[97,72],[98,73],[99,74]
    ], 75); // …79=+59；80=+60；81~82=+61…（81~100 依 60→80 段曲線鏡射拓展·91 起逐項+1）…99=+74；100=+75
}
function getStrMeleeCrit(str) {
    if (str <= 39) return 0;
    if (str <= 44) return 1;
    if (str <= 49) return 2;
    if (str <= 59) return 3;
    if (str <= 64) return 4;   // 60~64 = 4%
    if (str <= 69) return 5;   // 65~69 = 5%
    if (str <= 74) return 7;   // 70~74 = 7%
    if (str <= 79) return 8;   // 75~79 = 8%
    if (str <= 84) return 9;   // 80~84 = 9%
    if (str <= 89) return 10;  // 85~89 = 10%
    if (str <= 94) return 12;  // 90~94 = 12%（鏡射 70 跳階+2）
    if (str <= 99) return 13;  // 95~99 = 13%
    return 14;                 // 100 = 14%
}

// ---------- 敏捷 DEX：遠距離傷害 / 遠距離命中 / 遠距離爆擊率 / AC / ER ----------
function getDexRangedDmg(dex) {
    return lookupStep(dex, [
        [8,2],[11,3],[14,4],[17,5],[20,6],[23,7],[24,8],[26,9],[29,10],[32,11],
        [34,12],[35,13],[38,14],[41,15],[44,16],[47,20],[50,21],[53,22],[56,23],[59,24],
        [60,25],[62,26],[64,27],[65,28],[67,29],[69,30],
        [71,31],[73,32],[75,33],[77,34],[79,35],
        [80,36],[82,37],[84,38],[85,39],[87,40],[89,41],[91,42],[93,43],[95,44],[97,45],[99,46]
    ], 47); // …78~79=+35；80=+36；81~82=+37…（81~100 依 60→80 段曲線鏡射拓展）…98~99=+46；100=+47
}
function getDexRangedHit(dex) {
    // 敏捷7=-3 起，逐項對照
    return lookupStep(dex, [
        [7,-3],[8,-2],[9,-1],[10,0],[11,1],[12,2],[13,3],[14,4],[15,5],[16,6],
        [17,7],[18,8],[19,9],[20,10],[21,11],[22,12],[23,13],[24,14],[25,16],[26,17],
        [27,18],[28,19],[29,20],[30,21],[31,22],[32,23],[33,24],[34,25],[35,27],[36,28],
        [37,29],[38,30],[39,31],[40,32],[41,33],[42,34],[43,35],[44,36],[45,40],[46,41],
        [47,42],[48,43],[49,44],[50,45],[51,46],[52,47],[53,48],[54,49],[55,50],[56,51],
        [57,52],[58,53],[59,54],
        [60,55],[61,56],[62,57],[63,58],[64,59],[65,60],[66,61],[67,62],[68,63],[69,64],
        [71,65],[72,66],[73,67],[74,68],[75,69],[76,70],[77,71],[78,72],[79,73],
        [80,74],[81,75],[82,76],[83,77],[84,78],[85,79],[86,80],[87,81],[88,82],[89,83],
        [91,84],[92,85],[93,86],[94,87],[95,88],[96,89],[97,90],[98,91],[99,92]
    ], 93); // …79=+73；80=+74；81=+75…逐項+1…89=+83；90~91=+84（鏡射 70~71 併階）；92=+85…99=+92；100=+93
}
function getDexRangedCrit(dex) {
    if (dex <= 39) return 0;
    if (dex <= 44) return 1;
    if (dex <= 49) return 2;
    if (dex <= 59) return 3;
    if (dex <= 64) return 4;   // 60~64 = 4%
    if (dex <= 69) return 5;   // 65~69 = 5%
    if (dex <= 74) return 6;   // 70~74 = 6%
    if (dex <= 79) return 7;   // 75~79 = 7%
    if (dex <= 84) return 8;   // 80~84 = 8%
    if (dex <= 89) return 9;   // 85~89 = 9%
    if (dex <= 94) return 10;  // 90~94 = 10%
    if (dex <= 99) return 11;  // 95~99 = 11%
    return 12;                 // 100 = 12%
}
function getDexAC(dex) {
    // 回傳 AC 變化量（負值代表防禦提升）
    return lookupStep(dex, [
        [8,-2],[11,-3],[14,-4],[17,-5],[20,-6],[23,-7],[26,-8],[29,-9],[32,-10],[35,-11],
        [38,-12],[41,-13],[44,-14],[47,-15],[50,-16],[53,-17],[56,-18],[59,-19],
        [60,-20],[63,-21],[66,-22],[70,-23],[73,-24],[77,-25],
        [80,-26],[83,-27],[86,-28],[90,-29],[93,-30],[97,-31]
    ], -32); // …74~77=-25；78~80=-26；81~83=-27；84~86=-28；87~90=-29；91~93=-30；94~97=-31；98~100=-32
}
function getDexER(dex) {
    return Math.floor(Math.min(dex, 60) / 2); // ER = floor(敏捷/2)；敏捷超過60以60計，上限+30
}

// ---------- 智力 INT：魔法傷害 / 魔法命中 / 魔法爆擊率 / 額外魔法點數 / MP消耗減少 ----------
function getIntMagicDmg(int) {
    return lookupStep(int, [
        [14,0],[19,1],[24,2],[29,4],[34,5],[39,7],[44,8],[49,12],[54,13],[59,14],
        [60,15],[63,16],[66,17],[69,18],[72,20],[75,21],[77,22],[79,23],
        [80,25],[83,26],[86,27],[89,28],[92,30],[95,31],[97,32],[99,33]
    ], 35); // …78~79=+23；80=+25；81~83=+26…（81~100 依 60→80 段曲線鏡射拓展·90/100 跳階+2）…98~99=+33；100=+35
}
function getIntMagicHit(int) {
    return lookupStep(int, [
        [8,-4],[11,-3],[14,-2],[17,-1],[22,0],[24,1],[25,2],[28,3],[31,4],[34,5],
        [37,7],[40,8],[43,9],[44,10],[46,13],[49,14],[52,15],[55,16],[58,17],
        [60,18],[63,19],[66,20],[69,21],[72,22],[75,23],[79,24],
        [80,25],[83,26],[86,27],[89,28],[92,29],[95,30],[99,31]
    ], 32); // …76~79=+24；80=+25；81~83=+26…（81~100 依 60→80 段曲線鏡射拓展）…96~99=+31；100=+32
}
function getIntMagicCrit(int) {
    if (int <= 34) return 0;
    if (int <= 39) return 1;
    if (int <= 44) return 2;
    if (int <= 49) return 4;
    if (int <= 54) return 5;
    if (int <= 59) return 6;
    if (int <= 64) return 7;   // 60~64 = 7%
    if (int <= 69) return 8;   // 65~69 = 8%
    if (int <= 74) return 9;   // 70~74 = 9%
    if (int <= 79) return 10;  // 75~79 = 10%
    if (int <= 84) return 11;  // 80~84 = 11%
    if (int <= 89) return 12;  // 85~89 = 12%
    if (int <= 94) return 13;  // 90~94 = 13%
    if (int <= 99) return 14;  // 95~99 = 14%
    return 15;                 // 100 = 15%
}
function getIntExtraMp(int) {
    return lookupStep(int, [
        [11,2],[15,3],[19,4],[23,5],[27,6],[31,7],[35,8],[39,9],[43,10],[47,11],
        [51,12],[55,13],[59,14],
        [60,15],[63,16],[66,17],[69,18],[72,20],[75,21],[77,23],[79,24],
        [80,25],[83,26],[86,27],[89,28],[92,30],[95,31],[97,33],[99,34]
    ], 35); // …78~79=+24；80=+25；81~83=+26…（81~100 依 60→80 段曲線鏡射拓展·90/96 跳階+2）…98~99=+34；100=+35
}
function getIntMpReduce(int) {
    // MP消耗減少 %
    return lookupStep(int, [
        [8,5],[10,6],[11,7],[13,8],[14,9],[16,10],[17,11],[19,12],[20,13],[22,14],
        [23,15],[25,16],[26,17],[28,18],[29,19],[31,20],[32,21],[34,22],[35,23],[37,24],
        [38,25],[40,26],[41,27],[43,28],[44,29]
    ], 30); // 45~60 = 30%
}

// ---------- 體質 CON：HP成長 / HP自然恢復量上限 / 藥水額外恢復% ----------
function getConGrowth(con, cls) {
    // 體質8 = 0；CON 21 前維持完整成長，之後逐段遞減。
    // 最終 CON 仍會由 calcStats 追溯套用全部既有等級；這裡只降低高體質每點的 HP 成長效率。
    let per = (cls === 'knight' || cls === 'dragon' || cls === 'warrior') ? 1.5 : ((cls === 'dark' || cls === 'illusion') ? 0.5 : (cls === 'royal' ? 0.75 : 0.8));
    let pts = Math.max(0, Math.min(100, con) - 8);
    let effective = Math.min(pts, 13);                                      // CON 9~21：100%
    if (pts > 13) effective += Math.min(pts - 13, 19) * 0.50;               // CON 22~40：50%
    if (pts > 32) effective += Math.min(pts - 32, 20) * 0.25;               // CON 41~60：25%
    if (pts > 52) effective += Math.min(pts - 52, 20) * 0.125;              // CON 61~80：12.5%
    if (pts > 72) effective += Math.min(pts - 72, 20) * 0.0625;             // CON 81~100：6.25%
    return effective * per;
}
function getConHpRegenMax(con) {
    if (con < 11) return 0;
    return lookupStep(con, [
        [11,5],[13,6],[15,7],[17,8],[19,9],[21,10],[23,11],[24,12],[25,13],[27,14],
        [29,15],[31,16],[33,17],[34,18],[35,19],[37,20],[39,21],[41,22],[43,23],[44,24],
        [46,27],[48,28],[50,29],[52,30],[54,31],[55,32],[57,33],[59,34],
        [60,35],[63,36],[66,37],[69,38],[73,40],[76,42],[79,43],
        [80,45],[83,46],[86,47],[89,48],[93,50],[96,52],[99,53]
    ], 55); // …77~79=1~43；80=1~45；81~83=1~46…（81~100 依 60→80 段曲線鏡射拓展）…97~99=1~53；100=1~55
}
// 🍶 藥水恢復基準量：有 valMin/valMax 則隨機取整數區間（紅10~20/橙30~50/白60~80·v3.1.53），否則回固定 val。飲用瞬間擲（非掉落·不需 committed RNG；SL 重抽無經濟意義·同戰鬥擲骰）。
function potionHealBase(d) {
    if (!d) return 0;
    if (d.valMin != null && d.valMax != null) return d.valMin + Math.floor(Math.random() * (d.valMax - d.valMin + 1));
    return d.val || 0;
}
function getConPotionPct(con) {
    // 藥水額外恢復量 %
    if (con <= 19) return 0;
    if (con <= 24) return 1;
    if (con <= 30) return 2;
    if (con <= 35) return 3;
    if (con <= 40) return 4;
    if (con <= 45) return 5;
    if (con <= 50) return 6;
    if (con <= 55) return 7;   // 51~55 = +7%
    if (con <= 60) return 8;   // 56~60 = +8%
    if (con <= 65) return 9;   // 61~65 = +9%
    if (con <= 70) return 10;  // 66~70 = +10%
    if (con <= 74) return 11;  // 71~74 = +11%
    if (con <= 79) return 12;  // 75~79 = +12%
    if (con <= 80) return 13;  // 80 = +13%
    if (con <= 85) return 14;  // 81~85 = +14%
    if (con <= 90) return 15;  // 86~90 = +15%
    if (con <= 94) return 16;  // 91~94 = +16%
    if (con <= 99) return 17;  // 95~99 = +17%
    return 18;                 // 100 = +18%
}

// ---------- 精神 WIS：MP成長 / MP自然恢復量 / MR / 藍色藥水加成 ----------
function getWisGrowth(wis) {
    // 精神9 = 0；之後每+1精神 +0.5
    return Math.max(0, wis - 9) * 0.5;
}
function getWisMpRegen(wis) {
    return lookupStep(wis, [
        [9,1],[14,2],[19,3],[24,4],[29,6],[34,7],[39,9],[44,10],[49,14],[54,15],[59,17],
        [64,20],[69,21],[72,23],[75,24],[77,25],[79,26],
        [84,27],[89,28],[92,30],[95,31],[97,32],[99,33]
    ], 34); // …78~79=+26；80~84=+27；85~89=+28；90~92=+30；93~95=+31；96~97=+32；98~99=+33；100=+34（81~100 依 60→80 段曲線鏡射拓展）
}
function wisMpRegenIntervalTicks(wis) {
    // 基準為 16 秒；每 10 點精神縮短 1 秒，最低仍保留 1 秒自然回魔間隔。
    let steps = Math.max(0, Math.floor((Number(wis) || 0) / 10));
    return Math.max(10, 160 - steps * 10);
}
function getWisMR(wis) {
    // 精神7~10 = 0；11 = +4；之後每精神+1 MR+4；精神超過60以60計（上限 +200）
    if (wis <= 10) return 0;
    return (Math.min(wis, 60) - 10) * 4;
}
function getWisBlueBonus(wis) {
    // 藍色藥水：提升MP自然恢復量
    return lookupStep(wis, [
        [11,1],[13,2],[15,3],[17,4],[19,5],[21,6],[23,7],[24,8],[25,9],[27,10],
        [29,11],[31,12],[33,13],[34,14],[35,15],[37,16],[39,17],[41,18],[43,19],[44,20],
        [46,23],[48,24],[50,25],[52,26],[54,27],[55,28],[57,29],[59,30],
        [60,31],[63,32],[66,33],[69,34],[71,35],[74,36],[77,37],[79,38],
        [80,40],[83,41],[86,42],[89,43],[91,44],[94,45],[97,46],[99,47]
    ], 49); // …78~79=+38；80=+40；81~83=+41…（81~100 依 60→80 段曲線鏡射拓展·80/100 跳階+2）…98~99=+47；100=+49
}

// 🔒 戰鬥日誌捲動鎖定：玩家向上捲動查看舊訊息時，鎖定自動捲到底（避免新訊息把畫面拉走）；
//    捲回接近底部則自動解除。鎖定期間保留量加大（150 行），確保往上看得到更多歷史。
let _combatLogLocked = false;
const COMBAT_LOG_MAX = 50;          // 一般保留行數
const COMBAT_LOG_MAX_LOCKED = 150;  // 鎖定捲動時的加大保留量
function _combatLogIsAtBottom(el) { return (el.scrollHeight - el.scrollTop - el.clientHeight) < 24; }
function combatLogToBottom() {
    let el = document.getElementById('combat-log');
    if (!el) return;
    _combatLogLocked = false;
    el.scrollTop = el.scrollHeight;
    let btn = document.getElementById('combat-log-unlock'); if (btn) btn.classList.add('hidden');
}
function initCombatLogLock() {
    let el = document.getElementById('combat-log');
    if (!el || el._lockInit) return;
    el._lockInit = true;
    let onScroll = () => {
        let btn = document.getElementById('combat-log-unlock');
        if (_combatLogIsAtBottom(el)) {            // 回到底部：自動解除鎖定
            if (_combatLogLocked) { _combatLogLocked = false; if (btn) btn.classList.add('hidden'); }
        } else {                                    // 離開底部（向上看）：鎖定
            if (!_combatLogLocked) { _combatLogLocked = true; if (btn) btn.classList.remove('hidden'); }
        }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('touchmove', onScroll, { passive: true });
}

// ⚡ 快速強化（批次強化）狀態：wpn=武器分頁、arm=防具分頁（含飾品）。sel 為 uid→true 的勾選集合。
let quickEnh = { wpn: { active: false, target: 6, sel: {}, useBless: false }, arm: { active: false, target: 6, sel: {}, useBless: false } };   // 🌟 useBless：快速強化是否使用祝福卷（成功時 +1~+3）
// 🗑️ 快速廢品（批次標記廢品）狀態：wpn/arm/item 三分頁；啟用時預先勾選「已是廢品」者。sel 為 uid→true。（與快速強化同分頁互斥）
let quickJunk = { wpn: { active: false, sel: {}, known: {} }, arm: { active: false, sel: {}, known: {} }, item: { active: false, sel: {}, known: {} } };   // known＝面板開啟時(及之後同步)已納入的物品 uid，避免「面板開啟後才掉落的廢品」於確認時被誤取消標記

// ===== ⚔️ 戰鬥日誌來源過濾（敵人/玩家/傭兵/召喚/夥伴）=====
// _combatSrc：目前正在記錄的戰鬥訊息來源，由各攻擊派發點設定；為 null 時依顏色 type 推定（'enemy'→敵人，其餘→玩家）。
let _combatSrc = null;
const COMBAT_FILTER_KEY = 'lineage_idle_combat_filter';
let _combatFilter = { enemy: true, player: true, mercenary: true, summon: true, pet: true };
(function(){ try { let s = localStorage.getItem(COMBAT_FILTER_KEY); if (s) { let o = JSON.parse(s); for (let k in _combatFilter) if (typeof o[k] === 'boolean') _combatFilter[k] = o[k]; } } catch(e){} })();
function saveCombatFilter(){ try { localStorage.setItem(COMBAT_FILTER_KEY, JSON.stringify(_combatFilter)); } catch(e){} }
function applyCombatFilter(){
    let el = document.getElementById('combat-log');
    if (el) for (let k in _combatFilter) el.classList.toggle('cf-hide-' + k, !_combatFilter[k]);   // 以 CSS class 隱藏 → 既有與未來訊息一併套用，重新點亮即還原
    for (let k in _combatFilter) { let b = document.getElementById('cf-btn-' + k); if (b) b.classList.toggle('cf-off', !_combatFilter[k]); }   // 按鈕點亮/點暗
    { let sb = document.getElementById('cf-btn-status'); if (sb) sb.classList.toggle('cf-off', !_showMobStatus); }   // 🩹 狀態顯示鈕點亮/點暗（與過濾列同步初始化）
    { let hb = document.getElementById('cf-btn-hp'); if (hb) hb.classList.toggle('cf-off', !_showMobHp); }   // 🩸 血量顯示鈕點亮/點暗
}
function toggleCombatFilter(k){ if (!(k in _combatFilter)) return; _combatFilter[k] = !_combatFilter[k]; saveCombatFilter(); applyCombatFilter(); }
// 🩹 怪物異常狀態/出血鈍擊等標示顯示開關（按鈕在戰鬥日誌過濾列最左·點暗即隱藏怪卡上的狀態徽章與狀態列；頭目/席琳恩賜標籤不受影響）
let _showMobStatus = true;
(function(){ try { let s = localStorage.getItem('lineage_idle_mob_status'); if (s !== null) _showMobStatus = (s === '1'); } catch(e){} })();
function toggleMobStatus(){ _showMobStatus = !_showMobStatus; try { localStorage.setItem('lineage_idle_mob_status', _showMobStatus ? '1' : '0'); } catch(e){} let b = document.getElementById('cf-btn-status'); if (b) b.classList.toggle('cf-off', !_showMobStatus); renderMobs(); let tm = document.getElementById('town-npc-map'); if (tm) { tm.classList.toggle('show-labels', _showMobStatus); if (_showMobStatus && typeof _resolveTownLabelOverlap === 'function') _resolveTownLabelOverlap(); } }   /* 🏷️ v3.2.92 同步切換城鎮 NPC 名牌常駐顯示 */
// 🩸 怪物血量條顯示開關（按鈕在「狀態」左側·點亮才在怪卡顯示短血條；預設關閉＝沿用無血條的乾淨版面）
let _showMobHp = false;
(function(){ try { let s = localStorage.getItem('lineage_idle_mob_hp'); if (s !== null) _showMobHp = (s === '1'); } catch(e){} })();
function toggleMobHp(){ _showMobHp = !_showMobHp; try { localStorage.setItem('lineage_idle_mob_hp', _showMobHp ? '1' : '0'); } catch(e){} let b = document.getElementById('cf-btn-hp'); if (b) b.classList.toggle('cf-off', !_showMobHp); renderMobs(); }

function logCombat(msg, type="player", src=null) {
    if(state.ff) return; // 補跑期間不洗版
    const el = document.getElementById('combat-log');
    let colorClass = "text-white";
    
    // 單純以顏色區分，移除前綴標籤
    let catClass = "";   // 🎯 三大分類左色條：玩家一般攻擊(藍)／玩家技能(紫)／敵人傷害(紅)
    if (type === "player") { colorClass = "text-blue-300"; catClass = "log-cat-attack"; } // 我方普攻 (淺藍)
    else if (type === "player-heavy") { colorClass = "text-yellow-300 font-bold"; catClass = "log-cat-attack"; } // 我方重擊 (黃色粗體)
    else if (type === "player-crit") { colorClass = "crit-hit"; catClass = "log-cat-attack"; } // 我方爆擊 (顯眼鮮紅＋微光：僅保留給爆擊／含爆擊訊息)
    else if (type === "player-special") { colorClass = "text-orange-300"; catClass = "log-cat-attack"; } // 我方特殊效果/寵物等非爆擊傷害 (沉穩橘色，較不搶眼)
    else if (type === "player-graze") { colorClass = "text-blue-200/80"; catClass = "log-cat-attack"; } // 我方擦傷 (較亮的淡藍，灰底上仍清楚)
    else if (type === "skill") { colorClass = "text-purple-300"; catClass = "log-cat-skill"; } // 🟣 我方技能傷害 (紫色＋紫左條)
    else if (type === "enemy") { colorClass = "text-red-400"; catClass = "log-cat-enemy"; } // 敵方攻擊 (紅色＋紅左條)
    else if (type === "dot") { colorClass = "text-green-300"; catClass = "log-cat-dot"; } // 🟢 我方持續傷害/DoT (綠色＋綠左條：火牢/冰雪颶風/立方燃燒/中毒/出血/猛爆劇毒等週期傷害)
    else if (type === "magic") { colorClass = "text-cyan-300"; } // 魔法效果/法系觸發 (青色·非主動施放技能)
    else if (type === "heal") { colorClass = "text-green-300"; } // 恢復效果 (綠色)
    else if (type === "miss" || type === "dodge") { colorClass = "text-slate-200"; } // 未命中/閃避 (淺灰，避免與灰底相近)
    else if (type === "evade") { colorClass = "text-teal-300"; } // ER獨立迴避 (淡青綠色)

    let _src = src || _combatSrc || (type === 'enemy' ? 'enemy' : 'player');   // 來源：明確指定 > 派發點情境(_combatSrc) > 依顏色type推定
    el.insertAdjacentHTML('beforeend', `<div class="log-entry ${colorClass} ${catClass}" data-src="${_src}">${msg}</div>`);   // 🚀 只解析新訊息、不重建整個日誌(原 innerHTML+= 會 O(n) 重建全部子節點，戰鬥洗版時造成卡頓)
    // 🔒 鎖定捲動時保留更多歷史；未鎖定時維持一般上限
    let _max = _combatLogLocked ? COMBAT_LOG_MAX_LOCKED : COMBAT_LOG_MAX;
    while(el.children.length > _max && el.children.length > 1) el.removeChild(el.firstChild);
    if(!_combatLogLocked) el.scrollTop = el.scrollHeight;   // 鎖定時不自動捲到底，保留玩家檢視位置
}

// 🔒 系統與物品日誌捲動鎖定：與戰鬥日誌相同（向上捲動鎖定刷新、保留 150 行、捲回底部自動解除）
let _sysLogLocked = false;
const SYS_LOG_MAX = 50;           // 一般保留行數
const SYS_LOG_MAX_LOCKED = 150;   // 鎖定捲動時的加大保留量
function sysLogToBottom() {
    let el = document.getElementById('sys-log');
    if (!el) return;
    _sysLogLocked = false;
    el.scrollTop = el.scrollHeight;
    let btn = document.getElementById('sys-log-unlock'); if (btn) btn.classList.add('hidden');
}
function initSysLogLock() {
    let el = document.getElementById('sys-log');
    if (!el || el._lockInit) return;
    el._lockInit = true;
    let onScroll = () => {
        let btn = document.getElementById('sys-log-unlock');
        if ((el.scrollHeight - el.scrollTop - el.clientHeight) < 24) {   // 回到底部：自動解除鎖定
            if (_sysLogLocked) { _sysLogLocked = false; if (btn) btn.classList.add('hidden'); }
        } else {                                                          // 離開底部（向上看）：鎖定
            if (!_sysLogLocked) { _sysLogLocked = true; if (btn) btn.classList.remove('hidden'); }
        }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('touchmove', onScroll, { passive: true });
}

// 📌 v3.6.73 未讀點改為「只有傳說／遺物掉落才亮」（用戶指示：其餘訊息一律不顯示紅點）。
//    第二參 rare＝'legend'｜'relic'，只有這兩種才點亮並帶對應顏色（傳說橘／遺物藍）。
//    ⚠️ 既有 471 個呼叫端不傳第二參＝不亮點，無須逐一修改。
function logSys(msg, rare) {
    if (typeof _deferItemTransactionEffect === 'function' && _deferItemTransactionEffect(logSys, arguments, true)) return;
    if(state.ff) return; // 補跑期間不洗版
    const el = document.getElementById('sys-log');
    if (!el) return;
    el.insertAdjacentHTML('beforeend', `<div class="log-entry text-slate-100">${msg}</div>`);   // 🚀 同戰鬥日誌：只解析新訊息，避免 innerHTML+= 重建全部
    // 🔒 鎖定捲動時保留更多歷史（150 行）；未鎖定時維持一般上限（50 行）
    let _max = _sysLogLocked ? SYS_LOG_MAX_LOCKED : SYS_LOG_MAX;
    while(el.children.length > _max && el.children.length > 1) el.removeChild(el.firstChild);
    if(!_sysLogLocked) el.scrollTop = el.scrollHeight;   // 鎖定時不自動捲到底，保留玩家檢視位置
    if (_logTab !== 'sys' && (rare === 'legend' || rare === 'relic')) {   // 🗂️ v3.6.73 只有稀有掉落才亮未讀點（不在系統分頁時）
        let d = document.getElementById('logtab-dot-sys');
        if (d) { d.classList.remove('hidden', 'logtab-dot-legend', 'logtab-dot-relic'); d.classList.add('logtab-dot-' + rare); }   // 後到的稀有度覆蓋前一顆（點只有一顆）
    }
}

// 🗂️ v3.6.50 戰鬥／系統日誌合併於同一視窗：標題列分頁鈕切換（過濾 pill 只在戰鬥分頁顯示）。
let _logTab = 'combat';
function switchLogTab(tab) {
    _logTab = (tab === 'sys') ? 'sys' : 'combat';
    let onSys = (_logTab === 'sys');
    let cl = document.getElementById('combat-log'), sl = document.getElementById('sys-log');
    if (cl) cl.classList.toggle('hidden', onSys);
    if (sl) sl.classList.toggle('hidden', !onSys);
    let bc = document.getElementById('logtab-btn-combat'), bs = document.getElementById('logtab-btn-sys');
    if (bc) bc.classList.toggle('logtab-on', !onSys);
    if (bs) bs.classList.toggle('logtab-on', onSys);
    let pills = document.getElementById('combat-filter-pills'); if (pills) pills.classList.toggle('hidden', onSys);
    // 兩顆捲動鎖定提示各自只在自己的分頁出現（切走時先收起，避免浮在另一個日誌上）
    let cu = document.getElementById('combat-log-unlock'); if (cu && onSys) cu.classList.add('hidden');
    let su = document.getElementById('sys-log-unlock'); if (su && !onSys) su.classList.add('hidden');
    if (onSys) {
        let d = document.getElementById('logtab-dot-sys'); if (d) { d.classList.add('hidden'); d.classList.remove('logtab-dot-legend', 'logtab-dot-relic'); }   // 進系統分頁＝已讀（連稀有度顏色一併清掉，下次才不會沿用舊色）
        if (sl && !_sysLogLocked) sl.scrollTop = sl.scrollHeight;
        initSysLogLock();
    } else if (cl && !_combatLogLocked) cl.scrollTop = cl.scrollHeight;
}

// 🌐 v3.6.50 世界頻道：只放 NPC 對話（叫賣廣播／嗆聲／提問回覆），與系統日誌完全分流。
let _worldLogLocked = false;
const WORLD_LOG_MAX = 60;
const WORLD_LOG_MAX_LOCKED = 200;
function worldLogToBottom() {
    let el = document.getElementById('world-log');
    if (!el) return;
    _worldLogLocked = false;
    el.scrollTop = el.scrollHeight;
    let btn = document.getElementById('world-log-unlock'); if (btn) btn.classList.add('hidden');
}
function initWorldLogLock() {
    let el = document.getElementById('world-log');
    if (!el || el._lockInit) return;
    el._lockInit = true;
    let onScroll = () => {
        let btn = document.getElementById('world-log-unlock');
        if ((el.scrollHeight - el.scrollTop - el.clientHeight) < 24) {
            if (_worldLogLocked) { _worldLogLocked = false; if (btn) btn.classList.add('hidden'); }
        } else {
            if (!_worldLogLocked) { _worldLogLocked = true; if (btn) btn.classList.remove('hidden'); }
        }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('touchmove', onScroll, { passive: true });
}
function logWorld(msg, cls) {
    if (state.ff) return;   // 補跑期間不洗版（與其他日誌一致）
    const el = document.getElementById('world-log');
    if (!el) return;
    el.insertAdjacentHTML('beforeend', `<div class="log-entry ${cls || ''}">${msg}</div>`);
    let _max = _worldLogLocked ? WORLD_LOG_MAX_LOCKED : WORLD_LOG_MAX;
    while (el.children.length > _max && el.children.length > 1) el.removeChild(el.firstChild);
    if (!_worldLogLocked) el.scrollTop = el.scrollHeight;
}

// 🔧 架構#4：calcStats 職責拆分 ——
// recomputeStats()：純數值重算（屬性/裝備/套裝/變身/buff → player.d），含「裝備授予技能」同步，無畫面副作用。
// calcStats()：維持原有對外介面 = recomputeStats() + UI 刷新（applyElfBorder/updateUI），既有呼叫點行為不變。
// 不需要刷畫面的場合（如 buildAlly 換身重算）請呼叫 recomputeStats()。
// ===== 🔧 負重系統：計入負重的裝備欄位 + 物品重量表（依名稱）=====
const WEIGHT_COUNT_SLOTS = ['wpn','offwpn','shield','helm','armor','shin','tshirt','cloak','gloves','boots','amulet','ear1','ear2','ring1','ring2','ring3','ring4','belt','eye','pet','doll'];   // 🦵 shin=脛甲（盔甲下方·額外防具）   // ⚔️ offwpn=迅猛雙斧副手武器，計入負重；ear1/ear2=耳環；eye=眼睛；doll=魔法娃娃
const ITEM_WEIGHTS = {"混沌之刺":10,"混沌頭盔":5,"混沌斗篷":5,"混沌法袍":15,"混沌手套":5,"死亡斗篷":10,"死亡盔甲":100,"死亡手套":5,"死亡之盾":20,"惡魔王矛":20,"惡魔王雙刀":20,"惡魔王雙手劍":40,"惡魔王魔杖":20,"惡魔王弓":10,"亞連":10,"武士刀":40,"長劍":40,"斧":60,"雙手劍":150,"屠龍劍":180,"騎士范德之劍":100,"釘錘":30,"弓":30,"矛":80,"戰斧":120,"巴迪須":120,"柴刀":120,"精靈弓":30,"歐西斯弓":30,"闊劍":70,"木棒":30,"精靈匕首":10,"歐西斯匕首":10,"匕首":10,"貝卡合金":100,"法丘":60,"弗萊爾":15,"闊矛":75,"吉薩":80,"戟":150,"槍":180,"露西錘":150,"戰錘":50,"流星錘":120,"帕提森":80,"彎刀":40,"侏儒鐵斧":280,"精靈之矛":30,"歐西斯之矛":30,"小侏儒短劍":40,"精靈短劍":20,"歐西斯短劍":30,"短劍":30,"三叉戟":25,"瑟魯基之劍":120,"尤米弓":40,"短弓":20,"十字弓":50,"獵人之弓":30,"熾炎天使弓":25,"紅騎士之劍":40,"侵略者之劍":40,"骰子匕首":10,"大馬士革刀":45,"短劍的劍身":20,"長劍的劍身":30,"奧里哈魯根的劍身":35,"細劍":60,"鎖子甲破壞者":40,"銀長劍":50,"銀劍":40,"橡木魔法杖":15,"美基魔法杖":20,"巫術魔法杖":15,"力量魔法杖":15,"瑪那魔杖":15,"水晶魔杖":15,"失去魔力的巴列斯魔杖":15,"巴列斯魔杖":15,"潘的角":9,"覆上米索莉的角":24,"覆上奧里哈魯根的角":55,"巨斧":250,"狂戰士斧":200,"銀斧":270,"青銅鋼爪":20,"鋼鐵鋼爪":30,"暗影鋼爪":30,"銀光鋼爪":20,"黑暗鋼爪":20,"幽暗鋼爪":30,"大馬士革鋼爪":40,"青銅雙刀":20,"鋼鐵雙刀":30,"銀光雙刀":20,"幽暗雙刀":30,"黑暗雙刀":20,"暗影雙刀":30,"大馬士革雙刀":40,"黑暗十字弓":30,"幽暗十字弓":40,"魔力短劍":30,"拉斯塔巴德十字弓":70,"拉斯塔巴德弓":50,"小武士刀":30,"拉斯塔巴德長劍":30,"拉斯塔巴德短劍":20,"拉斯塔巴德魔杖":15,"拉斯塔巴德雙刀":40,"拉斯塔巴德重十字弓":100,"拉斯塔巴德矛":80,"拉斯塔巴德圓盾":50,"武官雙手劍":150,"武官手套":45,"武官長靴":54,"黑暗腰帶":40,"精靈皮盔":3,"歐西斯頭盔":30,"侏儒鐵盔":40,"頭盔":30,"騎士面甲":40,"抗魔法頭盔":35,"艾爾穆的祝福":13,"治癒魔法頭盔":50,"敏捷魔法頭盔":50,"力量魔法頭盔":50,"皮帽子":10,"銀釘皮帽":20,"皮頭盔":30,"骷髏頭盔":30,"鋼鐵頭盔":50,"法師之帽":20,"死亡騎士頭盔":50,"木乃伊王的王冠":20,"精靈敏捷頭盔":13,"精靈體質頭盔":13,"紅騎士頭巾":20,"巴土瑟之帽":20,"卡士柏之帽":20,"馬庫爾之帽":20,"西瑪之帽":20,"克特頭盔":50,"金屬盔甲":450,"水晶盔甲":350,"青銅盔甲":450,"藤甲":400,"皮甲":350,"鏈甲":300,"歐西斯鏈甲":300,"鱗甲":250,"銀釘皮甲":150,"環甲":250,"歐西斯環甲":250,"小藤甲":70,"皮夾克":30,"抗魔法鏈甲":300,"綿質長袍":10,"木甲":80,"精靈護胸金屬板":100,"精靈金屬盔甲":250,"精靈鏈甲":150,"木製的夾克":40,"皮背心":30,"皮盔甲":50,"銀釘皮背心":130,"硬皮背心":150,"骷髏盔甲":150,"鋼鐵金屬盔甲":470,"法師長袍":60,"水龍鱗盔甲":300,"地龍鱗盔甲":300,"火龍鱗盔甲":300,"風龍鱗盔甲":300,"死亡騎士盔甲":250,"黑長者長袍":30,"克特盔甲":250,"T恤":5,"精靈T恤":5,"精靈斗篷":10,"歐西斯斗篷":10,"侏儒斗篷":10,"保護者斗篷":10,"隱身斗篷":10,"抗魔法斗篷":10,"瑪那斗篷":10,"短統靴":10,"長靴":15,"巴列斯長靴":10,"皮涼鞋":8,"銀釘皮涼鞋":10,"皮長靴":10,"鋼鐵長靴":50,"深水長靴":15,"死亡騎士長靴":15,"黑長者涼鞋":10,"克特長靴":15,"手套":10,"水晶手套":20,"腕甲":10,"力量手套":18,"鋼鐵手套":40,"死亡騎士手套":15,"影子手套":10,"影子面具":10,"影子長靴":10,"拉斯塔巴德皮盔甲":70,"拉斯塔巴德長靴":10,"黑暗斗篷":20,"拉斯塔巴德長袍":30,"克特手套":15,"保護者手套":10,"小盾牌":30,"精靈盾牌":50,"阿克海盾牌":50,"大盾牌":100,"侏儒圓盾":100,"反射之盾":50,"伊娃之盾":50,"塔盾":120,"木盾":25,"銀騎士之盾":100,"皮盾牌":25,"銀釘皮盾":35,"骷髏盾牌":30,"紅騎士盾牌":50,"鋼鐵盾牌":140,"魔法能量之書":20,"傳送控制戒指":3,"變形控制戒指":3,"召喚控制戒指":3,"地靈戒指":3,"水靈戒指":3,"風靈戒指":3,"火靈戒指":3,"抗魔戒指":3,"滅魔戒指":3,"多羅戒指":3,"守護戒指":3,"長者戒指":3,"力量項鍊":5,"敏捷項鍊":5,"體質項鍊":5,"智力項鍊":5,"精神項鍊":5,"妖魔戰士項鍊":5,"守護項鍊":3,"長老項鍊":3,"抗魔項鍊":3,"老舊的身體腰帶":50,"老舊的精神腰帶":50,"老舊的靈魂腰帶":50,"身體腰帶":50,"精神腰帶":50,"靈魂腰帶":50,"多羅皮帶":50,"歐吉皮帶":50,"勇敢皮帶":50,"光明身體腰帶":50,"光明精神腰帶":50,"光明靈魂腰帶":50,"守護皮帶":50,"抗魔皮帶":50,"魔獸軍王之爪":100,"巴蘭卡鋼爪":40,"武官頭盔":45,"巴蘭卡頭盔":50,"武官護鎧":180,"巴蘭卡盔甲":450,"巴蘭卡手套":5,"魔獸軍王長靴":30,"巴蘭卡長靴":10,"冥法軍王斗篷":10,"法令軍王長袍":20,"暗殺軍王手套":25,"血色巨劍":160,"黑暗之劍":100,"紅水晶魔杖":60,"神官頭飾":18,"神官法袍":45,"黑暗披肩":20,"神官長靴":18,"神官斗篷":9,"神官手套":18,"死亡騎士的烈炎之劍":40,"克特之劍":40,"巨蟻女皇的金翅膀":1,"巨蟻女皇的銀翅膀":1,"暗殺軍王之痕":20,"神官魔杖":70,"蕾雅魔杖":15,"神官魔法書":27,"冥法軍王之戒":5,"蕾雅長袍":30,"蕾雅項鍊":5,"法令軍王之鍊":5,"蕾雅戒指":1,"冰之女王魔杖":20,"惡魔鐮刀":10,"魅力項鍊":5,"艾莉絲項鍊":5,"梅杜莎盾牌":80,"水晶短劍":45,"潔尼斯戒指":1,"地屬性斗篷":20,"水屬性斗篷":20,"火屬性斗篷":20,"風屬性斗篷":20,"黑暗長靴":15,"黑暗頭飾":5,"幻象眼魔的心眼":50,"馬昆斯斗篷":15,"銀光斗篷":30,"巫妖斗篷":30,"惡魔盔甲":250,"惡魔頭盔":50,"惡魔手套":15,"惡魔長靴":15,"暗黑雙刀":40,"暗黑鋼爪":40,"暗黑十字弓":50,"死神之手":30,"地靈手套":18,"風靈手套":18,"水靈手套":18,"火靈手套":18,"曼波帽子":10,"曼波外套":10,"金屬蜈蚣皮盔甲":250,"黑暗棲林者盔甲":30,"黑暗棲林者長靴":10,"黑虎皮斗篷":5,"狼皮斗篷":5,"熊戒指":3,"深淵戒指":3,"米索莉短劍":50,"奧里哈魯根短劍":50,"深紅長矛":100,"惡魔斧頭":180,"復仇之劍":40,"恨之鋼爪":30,"惡魔之劍":40,"惡魔雙刀":40,"惡魔鋼爪":30,"惡魔十字弓":30,"失去魔力的巴風特魔杖":15,"巴風特魔杖":15,"巴風特盔甲":30,"炎魔的血光斗篷":10,"墮落斗篷":10,"墮落長袍":25,"墮落手套":18,"墮落長靴":10,"黑燄之劍":50,"赤焰之弓":30,"赤焰之劍":40,"瑪那水晶球":50,"死亡之指":20,"寵物皮盔甲":60,"寵物骷髏盔甲":80,"寵物鋼鐵盔甲":150,"寵物十字盔甲":180,"寵物鏈甲":200,"寵物米索莉盔甲":120,"獵犬之牙":60,"鋼鐵之牙":50,"破滅之牙":150,"勝利之牙":100,"守護者臂甲":30,"法師臂甲":30,"體力臂甲":30,"巨劍":150,"牛人斧頭":250,"沙哈之弓":30,"風之頭盔":50,"黑暗妖精頭箍":30,"黑暗妖精鱗甲":60,"黑暗妖精涼鞋":30,"哈維戒指":3,"古代神射臂甲":30,"古代鬥士臂甲":30,"古老的劍":30,"古老的巨劍":70,"古老的弩槍":30,"古老的金屬盔甲":280,"古老的鱗甲":200,"古老的皮盔甲":180,"古老的長袍":30,"古代神之槍":40,"古代神之斧":40,"古代黑暗妖精之劍":20,"古代妖精弩槍":30,"隱藏的魔族之劍":35,"隱藏的魔族弓箭":35,"隱藏的魔族魔杖":35,"隱藏的魔族鋼爪":35,"隱藏的魔族鎖鏈劍":35,"隱藏的魔族奇古獸":35,"泰坦皮帶":50,"古代巨人戒指":50,"黑曜石奇古獸":10,"冥想奇古獸":35,"共鳴奇古獸":35,"寒冰奇古獸":35,"藍寶石奇古獸":10,"幻術士魔杖":15,"幻術士法書":30,"幻術士斗篷":10,"龍騎士雙手劍":80,"消滅者鎖鏈劍":50,"破滅者鎖鏈劍":50,"嗜血者鎖鏈劍":50,"共鳴鎖鏈劍":80,"寒冰鎖鏈劍":80,"龍鱗臂甲":30,"龍騎士斗篷":18,"底比斯歐西里斯弓":5,"底比斯歐西里斯雙刀":30,"底比斯歐西里斯雙手劍":100,"底比斯歐西里斯魔杖":100,"底比斯歐西里斯腰帶":50,"底比斯賀洛斯戒指":5,"底比斯阿努比斯戒指":5,"試煉斧頭":100,"大匠的斧頭":50,"戰士團頭盔":30,"戰士團斗篷":15,"神聖執行團的頭盔":30,"神聖執行團的斗篷":15,"魔物的斧頭":100,"鐵斧頭":100,"巨人的斧頭":100,"歐林的項鍊":1,"西瑪戒指":1,"黃金權杖":50,"紅色斗篷":10,"君主的威嚴":10,"守護者的戒指":3,"冰之女王魅力頭飾":10,"冰之女王魅力禮服":30,"冰之女王魅力涼鞋":30,"寒冰頭盔":45,"寒冰盔甲":100,"寒冰長靴":45,"破壞雙刀":40,"破壞鋼爪":35,"血紅慾望短劍":20,"榮耀之劍":50,"短刀":50,"海賊彎刀":60,"深淵雙刀":20,"漆黑水晶球":15,"寂靜十字弓":50,"信念之盾":50,"藍海賊長靴":15,"藍海賊頭巾":15,"藍海賊皮盔甲":150,"藍海賊手套":15,"藍海賊斗篷":10,"詛咒的紅色耳環":1,"詛咒的藍色耳環":1,"詛咒的綠色耳環":1,"淨化之耳環":15,"冰之女王的耳環 Lv0":5,"冰之女王的耳環 Lv1":5,"冰之女王的耳環 Lv2":5,"冰之女王的耳環 Lv3":5,"冰之女王的耳環 Lv4":5,"冰之女王的耳環 Lv5":5,"冰之女王的耳環 Lv6":5,"冰之女王的耳環 Lv7":5,"冰之女王的耳環 Lv8 力量":5,"冰之女王的耳環 Lv8 敏捷":5,"冰之女王的耳環 Lv8 智力":5,"冰之女王的耳環 Lv8 體質":5,"冰之女王的耳環 Lv8 精神":5,"冰之女王的耳環 Lv8 魅力":5,"受詛咒的鑽石戒指":1,"受詛咒的紅寶石戒指":1,"受詛咒的藍寶石戒指":1,"受詛咒的綠寶石戒指":1,"智慧耳環":3,"真實耳環":3,"支配耳環":3,"憤怒耳環":3,"勇猛耳環":3,"不死耳環":3,"熱情耳環":3,"名譽耳環":3,"寬容耳環":3,"舞動耳環":15,"雙子耳環":15,"慶典耳環":15,"絕頂耳環":15,"暴走耳環":15,"幻魔耳環":15,"族群耳環":15,"奴隸耳環":15,"尖刺雙刀":30,"武官之刃":120,"武官斗篷":9,"黑暗手套":10,"真．冥皇執行劍":100,"風刃短劍":60,"紅影雙刀":50,"獸王鋼爪":70,"聖晶魔杖":60,"魔力戒指":3,"力量戒指":3,"敏捷戒指":3,"知識戒指":3,"火精靈的皮帶":50,"水精靈的皮帶":50,"地精靈的皮帶":50,"風精靈的皮帶":50,"神意長靴":15,"勇氣長靴":15,"賽菲亞長靴":15,"瑪那長靴":15,"石製手套":50,"酷寒之矛":80,"雷雨之劍":40,"藍色鋼鐵瑪那魔杖":30,"紅色鋼鐵瑪那魔杖":30,"倫得雙刀":30};
// 🪆 魔法娃娃重量（spec 各 重量1）：以 Object.assign 補進，免動上方巨型字面
// ⚡ 元素施放傳說武器重量
Object.assign(ITEM_WEIGHTS, {"雷神之鎚":40,"帕格里奧之怒":40,"馬普勒的懲罰":50,"歐西斯衝撞錘":50,"伊娃的責罵":40});
// 🌑 v3.3.33 黑暗妖精聖地（依《黑暗妖精聖地.md》重量欄）
Object.assign(ITEM_WEIGHTS, {"吉爾塔斯之劍":100,"吉爾塔斯魔杖":100,"腐壞的長弓":100,"反叛者的盾牌":110,"武官之盾":45,"苦痛項鍊":10,"厄運項鍊":10,"受詛咒的黑色耳環":10,"賢者之戒":5,"真．冥皇披風":10,"真．冥皇護手":30,"真．冥皇鎧甲":100,"真．冥皇鋼靴":100,"真．冥皇面甲":100,"死亡騎士之書":5,"吉爾塔斯的封印":2,"修行者經典":5,"召喚球之核":10,"召喚球碎片":3,"完整的召喚球":15,"真．冥皇製作防具秘笈":5,"黑暗妖精的靈魂水晶":2,"受詛咒的真．冥皇執行劍":100});   // 🌑 v3.4.0 +受詛咒的真．冥皇執行劍
Object.assign(ITEM_WEIGHTS, {"解除詛咒的真死亡騎士．冥皇執行劍":100});   // 🌑 v3.4.67 +解除詛咒版冥皇執行劍（負重100）
Object.assign(ITEM_WEIGHTS, {"淨化藥水":3,"靈魂耳環(法師)":3,"靈魂耳環(鬥士)":3,"靈魂耳環(騎士)":3});   // 🌑 亞提利歐 靈魂耳環系列＋淨化藥水（依名稱）
Object.assign(ITEM_WEIGHTS, {"妖魔的鍋蓋":50,"哥布林的石刃":70,"妖魔弓箭手的彈簧弓":30,"地靈的木棍":30,"菌菇傘帽":3,"髒汙的地精靈T恤":5,"狼毛披肩":30,"哈士奇的骨棒":30,"侏儒的舊床單":10,"吃剩的魚骨頭":15,"放牧者的皮靴":10,"殭屍的小腿骨":15,"杜賓的尖銳犬齒":10,"安普長老的拐杖":15,"安特的乾枯樹皮":30,"通透的水晶體":30,"鬥士的歷戰彎刀":40,"冰原十字鎬":15,"怪手皮":10,"狼人的釘錘":15,"侏儒的笨重鎖甲":300,"風化的頭蓋骨":30,"惡臭的妖魔指甲":10,"妖魔的拳擊套":10,"牧神的放牧棍":80,"鱷魚皮內衣":5,"侍女的贈禮":5,"巨蟻的誘導觸角":20,"妖魔法師的餐桌巾":5,"有彈性的肋骨":30,"蟑螂的黑光甲殼":30,"石頭高崙的重拳":50,"妖魔的老舊菜刀":40,"強韌的大腿骨":30,"遺忘士兵的老舊長槍":30,"巨大蜘蛛的恐懼尖爪":20,"巡守的望遠鏡":3,"哈柏哥布林的研磨刀":70,"妖魔的屠刀":40,"妖魔的曬衣桿":30,"歐熊的柔軟毛皮":50,"蜥蜴人的鋼鐵圓盾":100,"穴居人的蹼":15,"史巴托的怨念":30,"食屍鬼的手環":3,"鯊魚的千刃牙":10,"鎧衛隊的漆黑塔盾":120,"黑騎士的精銳長槍":180,"水靈的魔力珠":15,"被敲爛的半邊頭盔":150,"黝黑的烈火皮囊":50,"食屍鬼的啃食面容":30});   // 🏺 遺物重量（依名稱·v3.5.27 +5 件）
Object.assign(ITEM_WEIGHTS, {"鎧衛隊的漆黑長槍":180,"人魚的淚滴":3,"妖魔的兜襠布":30,"月牙耳環":3,"楊果里恩的腹甲":50,"蟹人的巨鉗":50,"狂野的鬃毛外套":30,"劇毒的獠牙":150,"歐姆的腳鐐":50,"兵蟻的光澤背甲":450,"鼠人的烤肉叉":60,"海星的分裂腕足":80,"被遺忘的鱷魚靈魂":10,"破舊的蜥蜴甲":30,"資深蜥蜴族護手":10,"黑色疾風":60,"長老的雷電能量":20,"綠色妖鬼的指甲":10,"歐姆的粗皮褲":30,"食人妖精的相撲褌":50,"蛇女的尾鱗甲":30,"飛蝠之翼":10,"曼陀羅之靈":10,"歐姆士兵的重裝鎧甲":450,"三頭犬魔杖":15,"水靈的琴弦":40,"龍龜的背殼":100,"藍尾蜥蜴的斷尾":1,"蜥蜴人的大砍刀":120});   // 🏺 遺物 第二批重量（依名稱·v3.1.1）
Object.assign(ITEM_WEIGHTS, {"歐姆裝甲兵的超重鎚":130,"暗靈的迷霧披肩":1,"犰狳尖刺頭盔":30,"白螞蟻蛋殼":30,"高等蜥蜴鱗臂甲":30,"七彩鸚鵡喙":150,"海賊經典彎刀":40,"毒蠍的尾刺":10,"哈維的吸血爪":40,"隱蔽的死亡草葉":10,"黑魔法學徒魔杖":15,"巨熊的生命力":3,"民兵的萬用護甲":150,"神射手的重弦弓":40,"警衛的穿心矛":30,"旋風十字弓":30,"黑暗殘兵的訓練靴":10,"歐吉的巨大戰斧":130,"多羅的生命能量":5});   // 🏺 遺物 第三批重量（依名稱·v3.1.2）
Object.assign(ITEM_WEIGHTS, {"深海魚的電擊皮":5,"盜掠者的信物":3,"雪人之拳":20,"雪人手套":20,"輕薄的紙披風":1,"黑暗盜賊的兇殺爪":30,"暗精靈鎖鏈劍":35,"浸泡海水的內衣":5,"鬥士的老舊戰斧":120,"寄居蟹的巨大背殼":140,"爆彈花蕊":20,"古代聖甲蟲脛甲":20});   // 🏺 遺物 第四批重量＋雪人手套（依名稱·v3.1.4）
Object.assign(ITEM_WEIGHTS, {"虎男的斑紋毛皮":10,"柔軟的肉球":15,"熊貓的黑眼圈":30,"幼犬的稚嫩犬齒":30,"浣熊的變身葉":10,"聖伯納的急救酒桶":25,"貴重狐毛圍巾":5,"幸運暴走兔腳":5,"小獵犬的追蹤鼻":5,"柯利的柔毛":30,"袋鼠的拳擊套":50,"猴子的金箍棒":40,"漂浮之眼肉":2,"胡蘿蔔":1,"虎男誘食":2,"袋鼠的飼料":2,"熊貓的飼料":2,"猴子的飼料":2,"高麗犬誘食":2,"龍之心":10,"進化果實":5,"勝利果實":5});   // 🐾 v3.2.17 夥伴更新：遺物第十四批（規格書重量）＋誘捕道具/進化材料重量
Object.assign(ITEM_WEIGHTS, {"黑暗殘兵的研磨利刃":40,"黑暗殘兵輔助射擊手套":10,"巨人的木棒殘片":30,"食人妖精王的尖刺項圈":50,"莫妮亞的疾速涼鞋":50,"戰場風化的老舊內衣":5,"夢幻的蘑菇靈魂":10});   // 🏺 遺物 第五批重量（依名稱·v3.1.6）
Object.assign(ITEM_WEIGHTS, {"幽光的殘念":40,"殘冰的死亡氣息":60,"殘兵法師的魔力護盾":10,"喚獸師的訓練鞭":15,"金屬甲殼脛甲":120,"獅鷲的鋒利鷹爪":40,"凋零法師的護身符":5,"潛行者的祕密箱子":300,"巨大螞蟻的複眼":3,"巨大鱷魚的狩獵牙":40,"冰石的強襲鎚":280,"聖甲蟲的孵育巢":3});   // 🏺 遺物 第六批重量（依名稱·v3.1.13·孵育巢 v3.1.16）
Object.assign(ITEM_WEIGHTS, {"黑法師的修身褲":30,"變種蛇女的詭異鱗片":50,"海賊骷髏的陳年頭巾":30,"海賊的統御之戒":3,"巨人戰士的牙籤":50,"巨人的拋投石":50,"紅色妖鬼的詛咒指甲":10,"詛咒鎧甲的備用刀":20,"眼魔的凝視":15,"蠅災的詛咒":3,"純白虎皮大衣":350,"雪怪的大腳":15,"百變的透明內衣":5,"資深殘兵的重型劍":150,"刺針":50,"荊棘纏身的詛咒":30,"石化雞蛇的凝視":80});   // 🏺 遺物 第七批重量（依名稱·v3.1.18）
Object.assign(ITEM_WEIGHTS, {"月下狂嘯":50,"施毒者的實驗瓶":15,"孵育螞蟻精華":15});   // 🏺 遺物 第八批重量（依名稱·v3.1.21）
Object.assign(ITEM_WEIGHTS, {"阿魯巴的加速棍棒":10,"灰燼戰士的火焰長劍":40,"不死將軍的珍愛巨劍":150,"不動的鋼鐵堅壁":450,"掠奪者的染血腰帶":50,"暗黑蠍的雙鉗":40,"遺忘者的狙擊弓":30,"佈滿箭矢的毛皮":5,"邪惡蜥蜴的眼瞳":15,"烈焰射手的護腕":5});   // 🏺 遺物 第九批重量（依名稱·v3.1.28）
Object.assign(ITEM_WEIGHTS, {"之爪":0,"之眼":0,"之血":0,"之肉":0,"之心":0,"之骨":0,"之牙":0,"之鱗":0});   // 🦴 席琳遺骸 8 部位（依名稱·spec 重量 0·v3.1.68）
Object.assign(ITEM_WEIGHTS, {"擅自改造的十字弓":50,"蛇妖的無慈悲尾刺":120,"沉默的毒液":80,"魅惑之心":30,"劍客的輕便內衣":5});   // 🏺 遺物 第十批重量（依名稱·v3.1.32）
Object.assign(ITEM_WEIGHTS, {"纏繞炎球":15,"毒液化身":130,"黑夜狼人的駿腿":10,"牛頭怪的殘暴巨斧":130,"食人妖精的緩衝肚":150});   // 🏺 遺物 第十一批重量（依名稱·v3.1.33）
Object.assign(ITEM_WEIGHTS, {"火熱愛意":15,"無所畏懼的突擊":35,"灼熱蜥蜴長舌":5,"火焰化身的外皮":150,"殺人蜂的尾刺":30,"暴走兔最愛的胡蘿蔔":5,"寒冷化身的堅軀":150,"改造便利箭筒":10,"士兵的榮譽勳章":30,"邪惡寶箱內的遺物":5,"上古蜘蛛之爪":120,"火焰環繞的腰帶":10,"雷光加護的頭飾":10,"鎧甲守衛的笨重巨劍":120,"幻夢的火炎靈魂":10,"剝落的厚重冰石":150,"紅蠍尾環戒":5,"詛咒三頭獸的犄角":30,"光束強化魔杖":30});   // 🏺 遺物 第五批新增重量（依名稱·v3.1.52·19 件）
Object.assign(ITEM_WEIGHTS, {"提卡爾杰弗雷庫尖牙":1,"提卡爾杰弗雷庫之眼":1});   // 🐍 提卡爾雙 BOSS 傳說項鍊（v3.1.62·原材料改為傳說飾品）
Object.assign(ITEM_WEIGHTS, {"黑法師項鍊":5,"喚獸師項鍊":5,"黑法師之杖":15,"黑法師長袍":30,"喚獸師長袍":30});   // 🧙 v3.1.77 稽核中#13：黑法師/喚獸師 5 件掉落裝備補重量（比照蕾雅項鍊5/蕾雅魔杖15/蕾雅長袍30）
Object.assign(ITEM_WEIGHTS, {"提卡爾庫庫爾坎之矛":100,"提卡爾庫庫爾坎鐵手甲":100,"提卡爾庫庫爾坎之盾":30,"提卡爾庫庫爾坎面具":5,"阿茲特的反光石":5,"阿茲特的折射寶石":5,"艾庫尤卡的吹箭":50,"艾庫尤卡的永續箭筒":10,"艾庫卡伊拉的毒牙":30,"艾庫卡伊拉的華麗兜帽":30,"沾滿鱗粉的飛翼":10,"毒蛾的赤紅眼球":30,"艾庫艾托的鞭笞藤":100,"艾庫艾托的枯竭魔杖":70,"特產易碎泥偶":130,"祭祀儀式陶罐":50,"阿茲特獻祭亡靈":10,"薩德司卡石護臂":50,"薩德提歐的玩具鎚":120,"薩德提歐的笨重足跡":120,"蛇神的倒勾獠牙":100,"蛇神的凝視":1});   // 🐍 提卡爾 4 傳說裝+18 遺物重量（依名稱·v3.1.56）
Object.assign(ITEM_WEIGHTS, {"處刑人的護身斧":100,"處刑者的串刺刑具":100,"傑克的彈弓":20,"永不終止的夢魘":15,"無頭騎士的餘火":10,"歷練的警衛粗布手套":30,"黑虎的雙尾鞭":50,"束縛犬的控制鎖鏈":5,"守門人的破舊履":10,"漆黑的瑪那水晶球":50,"漆黑鬃毛長大衣":250,"耗弱精神的惡夢":5,"地之牙的殘核":15,"風之牙的微風":15,"水之牙的淚滴":15,"火之牙的餘燼":15,"馴獸師的訓狗棒":30,"治癒者的恢復魔棒":50,"魅魔女皇的誘惑":30,"來自陰影的刺劍":30,"風化的巨型方尖碑":200,"奪魂者雙刃劍":40,"格利芬的輕柔羽翼":5,"牛頭人的流星鎚":120,"精氣流動的腰帶":20,"思克巴女皇的熱情魔杖":70,"幽光的思念":3,"巫師的黑暗魔導書":20});   // 🏺 遺物 第十三批重量（依名稱·v3.1.80·28 件）
Object.assign(ITEM_WEIGHTS, {"魔法娃娃：雪人":1,"魔法娃娃：野狼寶寶":1,"魔法娃娃：史巴托":1,"魔法娃娃：奎斯坦修":1,"魔法娃娃：稻草人":1,"魔法娃娃：蛇女":1,"魔法娃娃：肥肥":1,"魔法娃娃：希爾黛斯":1,"魔法娃娃：石頭高崙":1,"魔法娃娃：長老":1,"魔法娃娃：雪怪":1,"魔法娃娃：亞力安":1,"魔法娃娃：美人魚":1,"魔法娃娃：小思克巴":1,"魔法娃娃：巨人":1,"魔法娃娃：王子":1,"魔法娃娃：公主":1,"魔法娃娃：男騎士":1,"魔法娃娃：女騎士":1,"魔法娃娃：男妖精":1,"魔法娃娃：女妖精":1,"魔法娃娃：男法師":1,"魔法娃娃：女法師":1,"魔法娃娃：男黑暗妖精":1,"魔法娃娃：女黑暗妖精":1,"魔法娃娃：男龍騎士":1,"魔法娃娃：女龍騎士":1,"魔法娃娃：男幻術士":1,"魔法娃娃：女幻術士":1,"魔法娃娃：思克巴女皇":1,"魔法娃娃：阿魯巴":1,"魔法娃娃：墮落":1,"魔法娃娃：變形怪":1,"魔法娃娃：飛龍":1,"魔法娃娃：莫提斯":1,"魔法娃娃：黑長者":1,"魔法娃娃：獨眼巨人":1,"魔法娃娃：艾莉絲":1,"魔法娃娃：木乃伊王":1,"魔法娃娃：死亡騎士":1,"魔法娃娃：巴風特":1,"魔法娃娃：吸血鬼":1,"魔法娃娃：克特":1,"魔法娃娃：冰之女王":1,"魔法娃娃：巴蘭卡":1,"魔法娃娃：巫妖":1,"魔法娃娃：安塔瑞斯":1,"魔法娃娃：法利昂":1,"魔法娃娃：林德拜爾":1,"魔法娃娃：巴拉卡斯":1});
// 🏺 遺物 第十四批（v3.3.0·14 件·單一怪物 0.0001% 掉落）
Object.assign(ITEM_WEIGHTS, {"與歐林的定情之戒":3,"馴獸師的飼料袋":3,"地元素屏障":50,"水元素屏障":50,"火元素屏障":50,"風元素屏障":50,"兇殘惡鬼的毒牙":40,"殘暴骸骨的破片":40,"屍毒之針":50,"不定形的變幻劍":110,"巨大鱷魚的皮革盔甲":180,"妖鬼王的畸形背瘤":50,"傳說海賊的迷幻雙刀":30,"熔岩灼燒的雙拳":50});
Object.assign(ITEM_WEIGHTS, {"魔力阻抗襯衫":15,"火精靈王的爆焰":150,"水精靈王的撫摸":40,"風精靈王的狂嘯":30,"地精靈王的抗拒":40,"純潔少女的憐愛":5,"破岩法師的秘術":30,"將軍愛用的握劍護腕":30});   // 🏺 遺物 第十五批重量（依規格）
[['西瑪','relic_orin_ring'],['拉斯塔巴德馴獸師','relic_tamer_feedbag'],['地元素守護者','relic_earth_barrier'],['水元素守護者','relic_water_barrier'],['火元素守護者','relic_fire_barrier'],['風元素守護者','relic_wind_barrier'],['殘暴的食屍鬼','relic_ghoul_fang'],['殘暴的史巴托','relic_sparto_shard'],['受詛咒的妖魔殭屍','relic_corpse_needle'],['遺忘之島變形怪','relic_morph_blade'],['遺忘之島巨大鱷魚','relic_croc_leather'],['遺忘之島卡司特王','relic_kasta_hump'],['德雷克','relic_pirate_dual'],['熔岩高崙','relic_lava_fists']].forEach(r => (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], 0.0001]));
// 🏺 遺物 第十六批重量（依規格·寵物防具/武器不計負重故不列）
Object.assign(ITEM_WEIGHTS, {"奴隸粗布衫":30,"地獄犬三頭釵":30,"巨魔的再生戒指":5,"烈焰巫師的正式長袍":30,"負重的堅忍巨臂":50,"笨重的鋼鐵石盾":250,"魔力泉源長靴":15,"暗黑的金屬棍棒":30,"召喚儀式的魔術布":10,"斷裂的昆蟲巨鉗":120,"魔力塑造的海洋水晶球":30,"燃燒殆盡的灰燼之拳":10,"死神的鐮刀破片":40,"巨靈的承諾":3,"被差遣的迷你闇精靈":10,"復仇者的十字弩弓":40});
// 🏺 遺物 第十六批掉落（單一怪物 0.0001%；地獄奴隸＝聖地版 sanct_hellslave·同名鍵）
[['受詛咒的馴獸師','relic_tamer_petarm'],['地獄奴隸','relic_slave_shirt'],['恐怖的地獄犬','relic_cerberus_pin'],['遺忘之島多羅','relic_troll_regen_ring'],['卡士柏','relic_flamemage_robe'],['底比斯 尖碑石奴(黑)','relic_burden_gauntlet'],['小惡魔','relic_imp_fang'],['恐怖的鋼鐵高崙','relic_iron_stone_shield'],['火焰之魔法師','relic_mana_spring_boots'],['暗黑萊肯','relic_dark_metal_club'],['炎魔的小惡魔','relic_summon_cloth'],['巨大守護螞蟻','relic_ant_pincer'],['馬庫爾','relic_ocean_orb'],['阿西塔基奧','relic_ash_fist'],['死神','relic_reaper_scythe'],['伊弗利特','relic_djinn_promise'],['黑暗精靈使','relic_mini_darkelf'],['黑暗復仇者','relic_avenger_crossbow']].forEach(r => (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], 0.0001]));
// 🏺 遺物 第十七批重量（依規格）
Object.assign(ITEM_WEIGHTS, {"重戰士的鏈鎖腰帶":150,"殘暴的骸骨意志之弓":40,"鬥士的決戰服裝":50,"幼龍的爪印":50,"滲透紅光的背後靈":5,"法師的護身短刀":30});
// 🌅 日出之國 傳說／體力戒指／16 遺物重量（依《日出之國.md》規格）
// 🔥 滅魔裝備（依《滅魔裝備.md》重量欄）
Object.assign(ITEM_WEIGHTS, {"滅魔的 金屬盔甲":170,"滅魔的 披肩":20,"滅魔的 鱗甲":120,"滅魔的 小藤甲":100});
Object.assign(ITEM_WEIGHTS, {"陰陽師的扇子":15,"巨型骷髏之指環":30,"體力戒指":3,"沸騰蒸氣的鍋蓋":30,"鐮鼬的藥壺":5,"長首妖怪的圍巾":3,"老舊的百年唐傘":10,"沸騰蒸氣的巨釜":250,"鐮鼬的尾刃":120,"河童的尻子玉":10,"赤鬼的內褲":10,"青鬼的虎皮衫":100,"毒鵺的黑尾":120,"天狗的羽扇":50,"阿修羅的武神技":15,"九尾妖狐的怒火":15,"牛鬼的斷角":20,"牛鬼之子的黑戒":5,"巨大骷髏的頭骨":150});
// 🏺 遺物 第十七批掉落（單一怪物 0.0001%）
[['歐姆戰士','relic_heavy_belt'],['殘暴的骷髏神射手','relic_bone_bow'],['殘暴的骷髏鬥士','relic_fighter_armor'],['幼龍','relic_drake_pawprint'],['火焰之靈魂(紅)','relic_red_wraith'],['受詛咒的艾爾摩法師','relic_mage_dagger']].forEach(r => (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], 0.0001]));
// 🏺 v3.6.44 遺物 第十九批掉落（15 件·各 0.0001%·「墳墓守護者」拆法師＋騎士兩隻同率）
[['深淵弓箭手','relic_marksman_corset'],['地靈之主','relic_earthshatter_sword'],['風靈之主','relic_gale_fistblade'],['火靈之主','relic_hellfire_hammer'],['墳墓守護者法師','relic_pet_devotion'],['墳墓守護者騎士','relic_pet_devotion'],['血色術士','relic_blood_ritual_dagger'],['恐怖的伊弗利特','relic_genie_wishes'],['火焰之靈魂(藍)','relic_cold_blueflame'],['火焰烈炎獸','relic_scorch_greatsword'],['底比斯 斯芬克斯','relic_guardian_riddle'],['闇黑君王','relic_mana_array_boots'],['血騎士','relic_bloodknight_dual'],['骨龍','relic_cursed_egg'],['受詛咒的艾爾摩士兵','relic_elmo_spear'],['遺忘之島亞力安','relic_petrify_essence']].forEach(r => (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], 0.0001]));
Object.assign(ITEM_WEIGHTS, {"精銳射手的戰鬥束衣":50,"大地碎裂劍":120,"疾風拳刃":60,"業火鍛造鎚":120,"珍愛夥伴的執念":5,"血祭儀式短刀":30,"巨靈的三個願望":3,"凜冽的青色火炎":120,"烈炎燒灼的滾燙巨劍":150,"守護獸的難題":10,"魔力凝聚的法陣":15,"嗜血騎士的雙刀":30,"充滿詛咒氣息的蛋":5,"艾爾摩尖頭槍":120,"石化魔法的精髓":60});   // 🏺 遺物重量（依名稱·v3.6.44 +15 件·蛋未給重量暫定 5）
// 🏺 v3.6.47 遺物 第二十批掉落（3 件·各 0.0001%）
[['烈炎獸','relic_lava_nozzle'],['飛龍','relic_doom_egg'],['重裝歐姆戰士','relic_crusher_hammer']].forEach(r => (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], 0.0001]));
Object.assign(ITEM_WEIGHTS, {"火山怪獸的熔岩噴嘴":120,"充滿厄運氣息的蛋":5,"重裝戰士的粉碎鎚":250});   // 🏺 遺物重量（依名稱·v3.6.47 +3 件·蛋未給重量比照詛咒蛋暫定 5）
// 🥚 v3.6.62 遺物 第二十一批掉落（2 件·各 0.0001%）：破滅蛋／災厄蛋＝補完四蜥蜴取得管道
[['遺忘之島飛龍','relic_doomsday_egg'],['深淵地靈','relic_calamity_egg']].forEach(r => (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], 0.0001]));
Object.assign(ITEM_WEIGHTS, {"充滿破滅氣息的蛋":5,"充滿災厄氣息的蛋":5});   // 🏺 遺物重量（依名稱·v3.6.62 +2 件·蛋未給重量比照前兩顆蛋暫定 5）
// 🏺 v3.7.20 遺物 第二十二批掉落（18 件·各 0.0001%·push 追加安全·⚠️怪鍵=顯示名·含半形空格「底比斯 斯芬克斯(黑)」）
[['遺忘之島巨大牛人','relic_maze_demon_glare'],['拉斯塔巴德近衛隊','relic_lining_chainshirt'],['冷酷冰原老虎','relic_icefang_armguard'],
 ['暗黑火焰弓箭手','relic_powder_arrow'],['遺忘之島邪惡蜥蜴','relic_lizardlord_crown'],['墳墓守護者法師','relic_steelmonk_staff'],
 ['黑長者','relic_elder_obsidian_orb'],['變形怪首領','relic_myriad_avatar'],['巴風特','relic_unsealed_baphomet_wand'],
 ['底比斯 斯芬克斯(黑)','relic_sphinx_black_wing'],['底比斯 尼荷斯','relic_overlook_thunder'],['受詛咒的艾爾摩將軍','relic_elmore_greatsword'],
 ['暗黑火焰戰士','relic_warrior_blackblade'],['遺忘之島獨眼巨人','relic_cyclops_dollsuit'],['西斯','relic_beheading_scythe'],
 ['曼波兔','relic_treasured_carrot'],['墳墓守護者騎士','relic_cross_tombshield'],['象牙塔紙人','relic_mage_scrap_note']].forEach(r => (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], 0.0001]));
Object.assign(ITEM_WEIGHTS, {"天使魔杖":20});   // 😇 v3.7.74 天使魔杖（單手魔杖·艾爾摩法師 0.01%）
Object.assign(ITEM_WEIGHTS, {"迷宮惡魔的瞥視":130,"盔甲內襯鎖鏈衣":30,"冰牙虎臂甲":15,"無限火藥爆裂矢":10,"蜥蜴領主的王冠":15,"鋼鐵僧侶的錫杖":80,"長老的黑曜水晶球":30,"百變化身":15,"解除封印的巴風特魔杖":15,"人面獅身的漆黑羽翼":10,"俯瞰大地的雷電":5,"艾爾摩古戰場巨劍":150,"戰士的漆黑之劍":120,"獨眼巨人的手製娃娃裝":30,"斬首的巨大鐮刀":150,"珍藏的巨大胡蘿蔔":50,"十字墓碑盾":250,"古代法師的隨手小抄":3});   // 🏺 遺物重量（依名稱·v3.7.20 +18 件·規格書指定值）
// 🏺 v3.7.52 遺物 第二十三批掉落（16 件·各 0.0001%·push 追加安全·⚠️怪鍵=顯示名·墮落的司祭一～五階各掉一件司祭苦行套裝）
[['象牙塔石頭高崙','relic_golem_lifemark'],['象牙塔密密','relic_serrated_fangs'],['克特','relic_kurt_shield'],
 ['長老隨從','relic_follower_cloak'],['火焰阿西塔基奧','relic_ashbeast_chain'],['炎魔的巴風特','relic_flame_baphomet_armor'],
 ['墮落的司祭(一階)','relic_priest_hood'],['墮落的司祭(二階)','relic_priest_gloves'],['墮落的司祭(三階)','relic_priest_collar'],
 ['墮落的司祭(四階)','relic_priest_robe'],['墮落的司祭(五階)','relic_priest_sandals'],['象牙塔鋼鐵高崙','relic_mageblade_knife'],
 ['卡魯塔','relic_ghost_teardrop'],['卡瑞','relic_true_dragonslayer'],['死亡騎士','relic_flame_dk_sword']].forEach(r => (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], 0.0001]));
Object.assign(ITEM_WEIGHTS, {"高崙的生命印記":5,"無數鋸齒的邪惡利牙":30,"克特之盾":150,"隨從的護身斗篷":10,"灰燼巨獸的束鏈":50,"烈焰焚燒的巴風特盔甲":30,"司祭的無眼頭飾":20,"司祭的斷指護手":10,"司祭的鎖喉頸圈":5,"司祭的腐爛長袍":30,"司祭的殘破草鞋":15,"專精劍術的魔劍士之刀":40,"受困幽魂的淚滴":5,"真‧屠龍劍":150,"烈焰的死亡騎士之劍":150});   // 🏺 遺物重量（依名稱·v3.7.52 +15 件·規格書指定值）
[['底比斯 尼荷斯(藍)','relic_sky_god_avatar'],['死亡的司祭(思克巴)','relic_necro_book']]
    .forEach(r => (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], 0.0001]));
Object.assign(ITEM_WEIGHTS, {"天空之神的化身":50,"死靈之書":10});   // 🏺 v3.8.12 遺物第二十四批重量
[['混沌的司祭(飛翼)','relic_wing_chaos_blades'],['象牙塔果凍怪','relic_corrosive_jelly_skin'],['巴列斯','relic_goat_demon_feet'],['暗黑思克巴女皇','relic_succubus_queen_kiss'],['傲慢的潔尼斯女王','relic_spider_queen_footprints']]
    .forEach(r => (MOB_DROPS[r[0]] = MOB_DROPS[r[0]] || []).push([r[1], 0.0001]));
Object.assign(ITEM_WEIGHTS, {"飛翼的混沌雙刀":30,"腐蝕的果凍外皮":10,"山羊惡魔的雙足":10,"斯克巴女皇的魅惑之吻":5,"蜘蛛女王的足跡":15});   // 🏺 v3.8.26 遺物第二十五批重量
Object.assign(ITEM_WEIGHTS, {"古代地龍鱗盔甲":250,"古代水龍鱗盔甲":250,"古代火龍鱗盔甲":250,"古代風龍鱗盔甲":250,"安塔瑞斯的力量":150,"安塔瑞斯的魅惑":50,"安塔瑞斯的泉源":100,"安塔瑞斯的霸氣":100,"地龍之魔眼":10,"深紅之弩":25});   // 🐉 安塔瑞斯副本裝備重量（依名稱·v3.7.57·規格書指定值）；🕸️ v3.7.75 深紅之弩重量 100→25（依新規格）
// 🐉 v3.7.57 侵蝕的安塔瑞斯巢穴掉落（依規格書·%·全新怪鍵無覆蓋疑慮；中間兩階變身不死不掉落·只有最終階結算）
Object.assign(MOB_DROPS, {
    '喀瑪南':   [['new_item_191', 0.001]],
    '喀瑪焰':   [['new_item_191', 0.001]],
    '喀瑪焰王': [['new_item_191', 0.01]],
    '喀瑪南王': [['new_item_191', 0.01]],
    '喀瑪王':   [['new_item_191', 0.01]],
    '大地荒龍': [['new_item_191', 0.001]],
    '被侵蝕的瘋狂安塔瑞斯': [
        ['arm_81', 2], ['new_item_151', 50], ['new_item_152', 50], ['new_item_153', 50],
        ['bk_break', 50], ['bk_slow', 50], ['bk_charm', 50], ['bk_str_up', 50], ['bk_earthquake', 50],
        ['bk_regen', 30], ['bk_summon', 30], ['bk_resurrection', 30], ['bk_quake', 30], ['bk_meteor', 3],
        ['bk_elf_earthshield', 10], ['bk_elf_earthbless', 10], ['bk_elf_steelguard', 10],
        ['mat_antharas_scale', 8], ['mat_antharas_claw', 8], ['mat_antharas_eye', 8], ['mat_antharas_blood', 8],
        ['mat_antharas_flesh', 8], ['mat_antharas_heart', 8], ['mat_antharas_bone', 8], ['mat_antharas_fang', 8],
        ['new_item_191', 100], ['bk_counter_barrier', 1], ['scroll_acc', 100],
        ['item_dragon_egg2', 5], ['item_dragon_egg', 5], ['item_sealed_earth_eye', 8],
        ['wpn_siruge', 50], ['wpn_dual_silver', 3], ['wpn_dual_abyss', 3], ['wpn_crimson_spear', 3],
        ['wpn_claw_silver', 3], ['wpn_claw_abyss', 3], ['wpn_32', 3], ['wpn_crimson_xbow', 3],
        ['clk_pride_earth', 10], ['arm_88', 3], ['acc_122', 10], ['acc_121', 10],
        ['rng_earth', 10], ['blt_body', 10], ['acc_131', 10], ['acc_130', 10]
    ]
});
// ⚖️ 負重顯示色：0～49% 暖白、50～81% 介面金黃、82%以上介面紅（loadTier 0/1/2～3）。
function getLoadColor(tier){ return Number(tier) >= 2 ? 'load-tone-danger' : (Number(tier) >= 1 ? 'load-tone-warning' : 'load-tone-normal'); }
// 🪆 取目前裝備之魔法娃娃的某 % 欄位值（expBonus/goldBonus/potionBonus…；未裝娃娃→0）
function dollFieldVal(field){ let e = player.eq && player.eq.doll; let dd = e ? DB.items[e.id] : null; return (dd && dd[field]) || 0; }

// ===== 🔧 強化系統：上限與分段加成（武器+15 / 防具+15 / 飾品+5）=====
//  +0~+10 維持原本「每階 +1」線性；+11 起在「+10 的量」之上再加下表（表值＝超過 +10 的額外部分）。
//  名稱一律顯示 +N（夾擠至上限：武器+15/防具+15/飾品+5；過往超過上限資料以上限顯示與套用，見 getItemFullName / capEn）。
//  ⚠️ v3.0.75 用戶：武器上限 +20→+15，既有 >+15 武器一律以 +15 計（顯示 capEn／能力 capWpnEn／最終傷害倍率 enhanceWpnFinalMult 皆已夾至此上限；loadGame 另做一次性實體降級）。
const ENHANCE_CAP = { wpn: 15, arm: 15, acc: 5 };
function enhanceCap(d) { return (d && (d.maxEn || ENHANCE_CAP[d.type])) || 10; }             // 依物品類型取強化上限（maxEn 可逐物品覆蓋·寵物防具+5）
function enhancementAtCap(en, cap) { return (Number(en) || 0) >= cap; }
function isMaxEnhanced(item) { let d = DB.items[item.id]; return !!d && enhancementAtCap(item.en, enhanceCap(d)); }
// 🏺 遺物判定（單一真相）：relic:true。維持 wpn/arm/acc 型別（供 equipCatKey 分類·遺物圖鑑）但用此旗標排除 強化/祝福/賦予/潘朵拉，並套海藍色。
function isRelic(d) { return !!(d && d.relic); }
// 🏺 遺物「寵物專屬命中」加成：掃玩家所有裝備欄，回傳 partnerHit[petName] 總和；高等進化型同時繼承原型效果。
function _relicPartnerHit(petName) { if (!petName || typeof player === 'undefined' || !player || !player.eq) return 0; let names = [petName]; if (/^高等/.test(petName)) names.push(petName.replace(/^高等/, '')); let s = 0; for (let k in player.eq) { let e = player.eq[k]; if (!e) continue; let dd = DB.items[e.id]; if (!dd || !dd.partnerHit) continue; for (let n of names) { if (dd.partnerHit[n]) { s += dd.partnerHit[n]; break; } } } return s; }
// 🏺 v3.1.80 馴獸師的訓狗棒：隊伍（玩家＋非倒地傭兵）任一人裝備 petSkillDmgMult → 寵物技能傷害 ×N（多件不疊加·取最高）
function _relicPetSkillMult() {
    let m = 1;
    try {
        let _scan = function (c) { if (!c || !c.eq) return; for (let k in c.eq) { let e = c.eq[k]; if (!e) continue; let dd = DB.items[e.id]; if (dd && dd.petSkillDmgMult) m = Math.max(m, dd.petSkillDmgMult); } };
        if (typeof player !== 'undefined' && player) { _scan(player); (player.allies || []).forEach(function (a) { if (a && !a._downed) _scan(a); }); }
    } catch (e) {}
    return m;
}
// 🔧 強化值上限夾擠：凡「隨強化提升」的基本能力與特效（額外傷害/命中、MP自然恢復、吸取MP、觸發機率、特效傷害…）
//    一律以淬鍊上限計算——武器超過 +15 以 +15 計、防具超過 +15 以 +15 計、飾品超過 +5 以 +5 計。
function capEn(en, d) { return Math.min(Math.max(0, Number(en) || 0), enhanceCap(d)); }
function capWpnEn(en) { return Math.min(Math.max(0, Number(en) || 0), ENHANCE_CAP.wpn); }   // 武器專用（上限 +15）
// ===== 🏰 天堂經典衝裝規則（v3.0.76 強化規則變更·機率單一真相：js/08 doEnhance／js/10 executeAutoSafeEnhance／js/10 _quickEnhanceUnit 共用）=====
//  安定值內(en < safe)：100% 成功（含負值——詛咒卷軸降至 -1 後再衝必成，即「紅變」技巧）。達到/超過安定值後：
//   武器：+9 前 1/3 成功、2/3 爆裝；+9 起 1/6 成功、1/6 無事發生、4/6 爆裝
//   防具(安定值>0)：成功率 = 1/目前強化值（例 +7 過 +8 為 1/7），失敗爆裝
//   防具(安定值0)／飾品：+0 成功率 1/2；+1 以上 = 1/(目前強化值×2)（例 +2 過 +3 為 1/4），失敗爆裝
function enhanceOutcomeFromRoll(type, safe, en, r) {
    if (en < safe) return 'ok';
    if (type === 'wpn') {
        if (en < 9) return r < 1 / 3 ? 'ok' : 'break';
        return r < 1 / 6 ? 'ok' : (r < 2 / 6 ? 'none' : 'break');
    }
    let rate = safe > 0 ? 1 / Math.max(1, en) : (en <= 0 ? 0.5 : 1 / (en * 2));
    return r < rate ? 'ok' : 'break';
}
function enhanceRollOutcome(d, en) {   // 擲一次衝裝骰 → 'ok'成功 | 'break'爆裝 | 'none'無事（僅武器 +9 起）
    let safe = (d && d.safe) || 0;
    en = Number(en) || 0;
    let r = en < safe ? 0 : Math.random();   // 🎲 安定值內不消耗亂數；其餘每次嘗試獨立，可 save/load 重抽
    return enhanceOutcomeFromRoll(d && d.type, safe, en, r);
}
// 🌟 祝福卷軸成功時的提升量：+2 以下(含負值) 各 1/3 機率 +1/+2/+3；+3~+5 各 1/2 機率 +1/+2；+6 以上無特殊功能（等同一般卷軸 +1）
function blessEnhanceGainFromRoll(en, r) {
    if (en <= 2) return 1 + Math.floor(r * 3);
    if (en <= 5) return 1 + Math.floor(r * 2);
    return 1;
}
function blessEnhanceGain(en) {
    en = Number(en) || 0;
    return blessEnhanceGainFromRoll(en, en <= 5 ? Math.random() : 0);
}
// 🛡️ runtime 合理性檢查：把「遊戲規則上不可能」的玩家數值夾回合法範圍，抓「隨手用 DevTools Console / 改存檔」調參數的笨外掛。
//    只夾「有硬性上限、超過即證明不可能」者：等級≤100（checkLvUp 硬上限）、裝備強化值≤各類上限、經驗/金幣為非負有限數。
//    ⚠️金幣的「高但合法」值與屬性點(player.base/bonus)無乾淨上限 → 刻意不夾，避免誤傷合法玩家（純客戶端分辨不出高額合法 vs 作弊）。
//    掛點：saveGame(寫檔前) + loadGame(讀檔後)；recomputeStats 另即時夾等級。失敗即爆裝/重算 hp/mp 等已由既有機制處理。
function sanitizeState() {
    if (typeof player !== 'object' || !player) return;
    let fin = (v, dft) => (typeof v === 'number' && isFinite(v)) ? v : dft;   // NaN/Infinity/非數 → 預設值
    player.lv   = Math.max(1, Math.min(100, Math.floor(fin(player.lv, 1)) || 1));   // 等級 [1,100]
    player.exp  = Math.max(0, fin(player.exp, 0));                                   // 經驗非負有限
    player.gold = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, fin(player.gold, 0)));   // 金幣：僅擋負值/NaN/Infinity，不擋高額合法金幣
    let clampEn = it => { let dd = it && DB.items[it.id]; if (dd && (dd.type === 'wpn' || dd.type === 'arm' || dd.type === 'acc')) it.en = Math.min(Math.max(-1, Number(it.en) || 0), enhanceCap(dd)); };   // 只夾裝備類（素材/消耗品不碰）；🏰 下限 -1（詛咒卷軸紅變，見 executeCurseDeEnhance）
    if (Array.isArray(player.inv)) player.inv.forEach(clampEn);
    if (player.eq) for (let k in player.eq) clampEn(player.eq[k]);
}
// 武器強化 → { dmg:額外傷害, hit:額外命中 }
//  額外傷害：+0~+20 每階+1（實務受 ENHANCE_CAP.wpn=15 夾擠，最高 +15）；
//  額外命中：+0~+10 每階+1，+10 之後依 WPN_EN_HIT_OVER10 累加。
const WPN_EN_HIT_OVER10 = { 11:1, 12:2, 13:4, 14:6, 15:8 };   // +11~+15 額外命中（超過 +10 的「累加」量；每階增量 1,1,2,2,2 逐級累加 → 總命中 +11/+12/+14/+16/+18）
function _enhanceWpnBonusRaw(en, hitOver) {
    return { dmg: Math.min(en, 20), hit: Math.min(en, 10) + hitOver };
}
function enhanceWpnBonusJson(en, hitOver) {
    return JSON.stringify(_enhanceWpnBonusRaw(en, hitOver));
}
function enhanceWpnBonus(en) {
    en = Math.max(0, Number(en) || 0);
    let hitOver = (en > 10) ? (WPN_EN_HIT_OVER10[Math.min(en, 20)] || 0) : 0;               // +11~+20：額外命中累積
    try {
        let parsed = JSON.parse(enhanceWpnBonusJson(en, hitOver));
        if (parsed && Number.isFinite(parsed.dmg) && Number.isFinite(parsed.hit)) return parsed;
    } catch (e) {}
    return _enhanceWpnBonusRaw(en, hitOver);                                                // 🔧 額外傷害每階+1；額外命中+1~+10後依表續加
}
// 武器強化 → 最終傷害倍率（一般物理攻擊）；+1~+20「取該階段數值」（非累加），+0 為 1.0
// 基準曲線（最高檔）：+1 ×1.02（平緩）→ +10 ×1.37 → +20 ×2.50（爆發）；總數值 100→250 對應的倍率（總數值/100）。
const WPN_EN_FINALMULT = {
    1:1.02, 2:1.04, 3:1.06, 4:1.09, 5:1.12, 6:1.15, 7:1.19, 8:1.24, 9:1.30, 10:1.37,
    11:1.45, 12:1.53, 13:1.62, 14:1.72, 15:1.83, 16:1.95, 17:2.08, 18:2.21, 19:2.35, 20:2.50
};
// 🔧 v2.6.65：+20 上限依「潘朵拉權重」分五級（曲線形狀相同·bonus 部分等比縮放）
//    分級用「未加倍」權重：js/14 initGachaWeights 對權重≥50 一律×2（提高低稀有度出現率）→ runtime≥100 者先還原÷2 再分級
//    權重1→×2.5；2~20→×2.25；21~50→×2.0；51~75→×1.75；76~100→×1.5；權重0(非潘朵拉)：legend 傳說→×2.5、其餘(店賣/量產)→×1.5
function wpnEnCurveMax(def) {
    if (!def) return 2.5;                        // 查無定義（防呆）→ 沿用最高檔（舊行為）
    if (def.legend) return 2.5;                  // 🔧 v2.6.66：傳說(legend)武器一律最高檔（不看權重·修 蕾雅魔杖 w10 落 ×2.25）
    let w = def.gachaWeight;
    if (w == null) return 2.5;
    // 🔧 v3.0.81：initGachaWeights 的 ×2 加倍已移除→runtime 權重＝原始權重，直接分級（原「÷2 還原」邏輯刪除·各武器分級結果不變）
    if (w <= 0) return 1.5;                      // 權重0（非潘朵拉）：店賣/量產基本武器→最低檔（legend 已於上方攔截）
    if (w <= 1) return 2.5;
    if (w <= 20) return 2.25;
    if (w <= 50) return 2.0;
    if (w <= 75) return 1.75;
    return 1.5;
}
function enhanceWpnFinalMult(en, def) {
    return 1;   // 🔧 v3.1.25 用戶要求移除「武器強化最終傷害倍率」機制：一律回傳 1（所有戰鬥呼叫點 ×1＝無效化）。強化仍保留固定命中/傷害加成（實作＝js/02 calcStats 內 enhanceWpnBonus() 的 _enW，每+1→近/遠 傷害各+1、命中 +1~+10 後依 WPN_EN_HIT_OVER10 續加·⚠️改用符號名指路，行號會漂移）。⚠️ 上方 WPN_EN_FINALMULT 曲線與 wpnEnCurveMax 保留供日後還原（把本函式改回原計算即可）。
}
function wpnEnFinalMult(wpnInst) { return enhanceWpnFinalMult(wpnInst && wpnInst.en, wpnInst && DB.items[wpnInst.id]); }      // 由武器實例取倍率（未裝備→1）

// ===== ⚔️ 攻擊速度改由「職業性別 × 武器種類」決定（2026-07 用戶要求·武器 def 的 spd 欄位停用） =====
// 表值單位＝「動作/分鐘」（interval 秒 = 60/APM）。基準＝用戶表A（單手劍72/單手鈍器65/弓60/單手矛68/魔杖72/匕首75/雙手劍65/雙刀72/鋼爪72/鎖鏈劍68/雙斧72/奇古獸72）；
// 職業性別差異＝用戶表B風格（天堂原作攻速表：男騎士全近戰快·女騎士弓稍快、王子斧矛杖快·公主劍匕快、女妖精劍最快·男妖精斧矛較快、法師近戰全慢·女法師杖稍快、女黑妖雙刀90傳奇·男黑妖刃系快）。
// 規則：雙手鈍器＝雙手劍速度；槍矛欄＝單手矛；雙手矛＝介於單手矛與雙手劍之間；雙斧＝戰士雙持單手斧（主副手各打一次）時的整體速度。
// ⚠️ 不能裝備的組合（表A為0）仍填後備值（防呆用·裝備白名單另行把關）。新職業/新武器種類請補表。
const ATK_APM = {
    '王子': { '單手劍':60, '單手鈍器':65.45, '弓':48, '十字弓':48, '單手矛':68.57, '雙手矛':62.61, '魔杖':48, '匕首':68.57, '雙手劍':51.43, '雙手鈍器':51.43, '雙刀':57.6, '鋼爪':62.61, '鎖鏈劍':60, '雙斧':65.45, '奇古獸':48 },
    '公主': { '單手劍':60, '單手鈍器':65.45, '弓':48, '十字弓':48, '單手矛':68.57, '雙手矛':62.61, '魔杖':48, '匕首':68.57, '雙手劍':51.43, '雙手鈍器':51.43, '雙刀':57.6, '鋼爪':62.61, '鎖鏈劍':60, '雙斧':65.45, '奇古獸':48 },
    '男騎士': { '單手劍':65.45, '單手鈍器':60, '弓':40, '十字弓':40, '單手矛':68.57, '雙手矛':62.61, '魔杖':51.43, '匕首':68.57, '雙手劍':57.6, '雙手鈍器':57.6, '雙刀':57.6, '鋼爪':62.61, '鎖鏈劍':65.45, '雙斧':60, '奇古獸':51.43 },
    '女騎士': { '單手劍':65.45, '單手鈍器':60, '弓':40, '十字弓':40, '單手矛':68.57, '雙手矛':62.61, '魔杖':43.64, '匕首':68.57, '雙手劍':57.6, '雙手鈍器':57.6, '雙刀':57.6, '鋼爪':62.61, '鎖鏈劍':65.45, '雙斧':60, '奇古獸':43.64 },
    '男妖精': { '單手劍':68.57, '單手鈍器':55.38, '弓':60, '十字弓':60, '單手矛':55.38, '雙手矛':51.43, '魔杖':51.43, '匕首':75.79, '雙手劍':60, '雙手鈍器':60, '雙刀':62.61, '鋼爪':68.57, '鎖鏈劍':68.57, '雙斧':55.38, '奇古獸':51.43 },
    '女妖精': { '單手劍':68.57, '單手鈍器':55.38, '弓':60, '十字弓':60, '單手矛':49.66, '雙手矛':46.45, '魔杖':38.92, '匕首':75.79, '雙手劍':60, '雙手鈍器':60, '雙刀':62.61, '鋼爪':68.57, '鎖鏈劍':68.57, '雙斧':55.38, '奇古獸':38.92 },
    '男法師': { '單手劍':57.6, '單手鈍器':51.43, '弓':34.29, '十字弓':34.29, '單手矛':51.43, '雙手矛':48, '魔杖':46.45, '匕首':62.61, '雙手劍':51.43, '雙手鈍器':51.43, '雙刀':53.33, '鋼爪':57.6, '鎖鏈劍':57.6, '雙斧':51.43, '奇古獸':46.45 },
    '女法師': { '單手劍':57.6, '單手鈍器':51.43, '弓':34.29, '十字弓':34.29, '單手矛':51.43, '雙手矛':48, '魔杖':46.45, '匕首':62.61, '雙手劍':51.43, '雙手鈍器':51.43, '雙刀':53.33, '鋼爪':57.6, '鎖鏈劍':57.6, '雙斧':51.43, '奇古獸':46.45 },
    '男黑暗妖精': { '單手劍':65.45, '單手鈍器':60, '弓':51.43, '十字弓':51.43, '單手矛':60, '雙手矛':55.38, '魔杖':49.66, '匕首':84.71, '雙手劍':57.6, '雙手鈍器':57.6, '雙刀':55.38, '鋼爪':72, '鎖鏈劍':65.45, '雙斧':60, '奇古獸':49.66 },
    '女黑暗妖精': { '單手劍':65.45, '單手鈍器':60, '弓':51.43, '十字弓':51.43, '單手矛':60, '雙手矛':55.38, '魔杖':51.43, '匕首':84.71, '雙手劍':57.6, '雙手鈍器':57.6, '雙刀':55.38, '鋼爪':72, '鎖鏈劍':65.45, '雙斧':60, '奇古獸':51.43 },
    '男龍騎士': { '單手劍':65.45, '單手鈍器':60, '弓':40, '十字弓':40, '單手矛':68.57, '雙手矛':62.61, '魔杖':51.43, '匕首':68.57, '雙手劍':57.6, '雙手鈍器':57.6, '雙刀':57.6, '鋼爪':62.61, '鎖鏈劍':65.45, '雙斧':60, '奇古獸':51.43 },
    '女龍騎士': { '單手劍':65.45, '單手鈍器':60, '弓':40, '十字弓':40, '單手矛':68.57, '雙手矛':62.61, '魔杖':43.64, '匕首':68.57, '雙手劍':57.6, '雙手鈍器':57.6, '雙刀':57.6, '鋼爪':62.61, '鎖鏈劍':65.45, '雙斧':60, '奇古獸':43.64 },
    '男戰士': { '單手劍':60, '單手鈍器':65.45, '弓':48, '十字弓':48, '單手矛':68.57, '雙手矛':62.61, '魔杖':48, '匕首':68.57, '雙手劍':51.43, '雙手鈍器':51.43, '雙刀':57.6, '鋼爪':62.61, '鎖鏈劍':60, '雙斧':65.45, '奇古獸':48 },
    '女戰士': { '單手劍':60, '單手鈍器':65.45, '弓':48, '十字弓':48, '單手矛':68.57, '雙手矛':62.61, '魔杖':48, '匕首':68.57, '雙手劍':51.43, '雙手鈍器':51.43, '雙刀':57.6, '鋼爪':62.61, '鎖鏈劍':60, '雙斧':65.45, '奇古獸':48 },
    '男幻術士': { '單手劍':57.6, '單手鈍器':51.43, '弓':34.29, '十字弓':34.29, '單手矛':51.43, '雙手矛':48, '魔杖':46.45, '匕首':62.61, '雙手劍':51.43, '雙手鈍器':51.43, '雙刀':53.33, '鋼爪':57.6, '鎖鏈劍':57.6, '雙斧':51.43, '奇古獸':46.45 },
    '女幻術士': { '單手劍':57.6, '單手鈍器':51.43, '弓':34.29, '十字弓':34.29, '單手矛':51.43, '雙手矛':48, '魔杖':46.45, '匕首':62.61, '雙手劍':51.43, '雙手鈍器':51.43, '雙刀':53.33, '鋼爪':57.6, '鎖鏈劍':57.6, '雙斧':51.43, '奇古獸':46.45 },
};
// ⚔️ 硬直：被直接命中時延遲下次攻擊的 tick 數（天堂 damage 動作幀 ÷2.4·帶職業）
const HITSTUN_TICKS = { '王子':6, '公主':6, '男騎士':5, '女騎士':6, '男妖精':5, '女妖精':5, '男法師':5, '女法師':5, '男黑暗妖精':5, '女黑暗妖精':5, '男龍騎士':5, '女龍騎士':6, '男戰士':6, '女戰士':6, '男幻術士':5, '女幻術士':5 };
// 🔮 施法：攻擊、治癒、淨化、轉換與手動法術共用的職業基礎間隔 tick（天堂 spell 動作幀 ÷2.4·法師最快10、黑妖/王族最慢14）
const CAST_TICKS = { '王子':14, '公主':14, '男騎士':13, '女騎士':13, '男妖精':12, '女妖精':12, '男法師':10, '女法師':10, '男黑暗妖精':14, '女黑暗妖精':14, '男龍騎士':13, '女龍騎士':13, '男戰士':14, '女戰士':14, '男幻術士':10, '女幻術士':10 };
const ATK_APM_DEFAULT = { '單手劍':72, '單手鈍器':65, '弓':60, '十字弓':60, '單手矛':68, '雙手矛':66, '魔杖':72, '匕首':75, '雙手劍':65, '雙手鈍器':65, '雙刀':72, '鋼爪':72, '鎖鏈劍':68, '雙斧':72, '奇古獸':72 };   // 表A基準（未知頭像後備）
const ATK_AV_BY_CLS = { royal:'王子', knight:'男騎士', elf:'男妖精', mage:'男法師', dark:'男黑暗妖精', dragon:'男龍騎士', warrior:'男戰士', illusion:'男幻術士' };   // 舊檔缺 avatar → 依職業取男性列
// 🗂️ 武器 → 攻速種類：WEAPON_TAGS 優先，再依旗標（isBow/qigu/chainsword/isWandWeapon），最後名稱後備；結果快取於 def._spdFam
function atkSpdFamily(id) {
    let d = DB.items[id]; if (!d || d.type !== 'wpn') return null;
    if (d.relicBaseId !== undefined) {
        const baseId = d.relicBaseId, base = typeof baseId === 'string' && DB.items[baseId];
        if (!base || base.relic || base.relicBaseId !== undefined || base.type !== 'wpn') return null;
        id = baseId; d = base;
    }
    if (d.isArrow || (!d.isBow && /箭$/.test(d.n || ''))) return null;   // 箭矢（箭/銀箭/米索莉箭/沙哈之箭／🏺 改造便利箭筒 isArrow·type:wpn 但裝於箭矢欄·非揮擊武器）；🏹 v3.5.8 isBow 放行：隱藏的魔族弓箭/艾庫尤卡的吹箭是弓非箭矢·原被「箭」字尾誤殺→動態變空手、攻速/tooltip 掉單手劍 fallback
    if (d._spdFam) return d._spdFam;
    let tg = (typeof getWeaponTags === 'function') ? getWeaponTags(id) : [], n = d.n || '', fam = null;
    if (tg.includes('雙刀')) fam = '雙刀';
    else if (tg.includes('鋼爪')) fam = '鋼爪';
    else if (tg.includes('匕首')) fam = '匕首';
    else if (tg.includes('雙手鈍器')) fam = '雙手鈍器';
    else if (tg.includes('單手鈍器')) fam = '單手鈍器';
    else if (tg.includes('雙手劍')) fam = '雙手劍';
    else if (tg.includes('矛')) fam = d.w2h ? '雙手矛' : '單手矛';
    else if (tg.includes('單手劍') || tg.includes('武士刀')) fam = '單手劍';
    else if (d.isBow) fam = /十字弓|弩/.test(n) ? '十字弓' : '弓';
    else if (d.qigu) fam = '奇古獸';
    else if (d.chainsword) fam = '鎖鏈劍';
    else if ((typeof isWandWeapon === 'function' && isWandWeapon(d)) || /水晶球/.test(n)) fam = '魔杖';   // 含 d.isWand（惡魔鐮刀）·排除權杖；漆黑水晶球＝法師/幻術士持握→魔杖
    else if (/矛|槍|戟/.test(n)) fam = d.w2h ? '雙手矛' : '單手矛';
    else if (/斧|鎚|錘|槌|棒|棍|鐮/.test(n)) fam = d.w2h ? '雙手鈍器' : '單手鈍器';
    else if (/匕首|小刀|之刺/.test(n)) fam = '匕首';
    else fam = d.w2h ? '雙手劍' : '單手劍';
    d._spdFam = fam; return fam;
}
// 取「動作/分鐘」：p＝玩家或傭兵（讀 avatar·缺→依 cls 男性列）；id 未給→取 p.eq.wpn；戰士雙持（offwpn）→雙斧速度
function atkSpdApmResolved(hasWeapon, avatarFamilyApm, defaultFamilyApm) {
    if (!hasWeapon) return 60;
    return avatarFamilyApm || defaultFamilyApm || 60;
}
function atkSpdApm(p, id) {
    let av = (p && p.avatar && ATK_APM[p.avatar]) ? p.avatar : ATK_AV_BY_CLS[(p && p.cls) || ''];
    let row = ATK_APM[av] || ATK_APM_DEFAULT;
    let wid = id || (p && p.eq && p.eq.wpn ? p.eq.wpn.id : null);
    if (!wid) return atkSpdApmResolved(false, 0, 0);   // 空手＝每分鐘 60 次（維持原 1.0s 間隔）
    let fam = atkSpdFamily(wid) || '單手劍';
    // ⚔️ v3.5.100 主副手攻速分離：移除「裝副手 → 主手改吃雙斧家族」的覆蓋。
    //   舊制讓雙手鈍器主手一裝副手就從 51.43 跳到 65.45 APM（戰士 +27%），等於主手借用副手的速度；
    //   現在兩手各用自己的武器家族，副手的間隔由 d.aspdOff 另計（js/02）。
    //   （'雙斧' 這一欄在 ATK_APM 全 16 職與 '單手鈍器' 數值完全相同＝純別名，移除覆蓋不影響單手鈍器主手。）
    return atkSpdApmResolved(true, row[fam], ATK_APM_DEFAULT[fam]);
}
function atkSpdBaseIntervalFromApm(apm) { return Math.round(6000 / Math.max(1, apm)) / 100; }
function atkSpdBaseItv(p) { return atkSpdBaseIntervalFromApm(atkSpdApm(p)); }   // 基礎攻擊間隔（秒·2位小數·未含加速/精通等倍率）
function hitstunTicks(p) { let av = (p && p.avatar && HITSTUN_TICKS[p.avatar]) ? p.avatar : ATK_AV_BY_CLS[(p && p.cls) || '']; return HITSTUN_TICKS[av] != null ? HITSTUN_TICKS[av] : 5; }   // ⚔️ 職業硬直 tick（被擊時延遲攻擊）
function castLockTicks(p) { let av = (p && p.avatar && CAST_TICKS[p.avatar]) ? p.avatar : ATK_AV_BY_CLS[(p && p.cls) || '']; return CAST_TICKS[av] != null ? CAST_TICKS[av] : 12; }   // 🔮 職業施法冷卻下限 tick
function castIntervalTicks(p, support) {
    let key = support ? 'supportCastLock' : 'castLock';
    let v = (p && p.d && p.d[key] != null) ? p.d[key]
          : ((p && p.d && p.d.castLock != null) ? p.d.castLock : castLockTicks(p));
    return Math.max(1, Number(v) || 12);
}   // 🔮 施法間隔：攻擊／輔助可分流；保留小數 tick 才能準確呈現 CSV 的每分鐘次數，攻擊速度增減不介入。
function nextCastCooldown(current, p, support) {
    let carry = Number(current);
    carry = Number.isFinite(carry) && carry < 0 ? Math.max(-0.999999, carry) : 0;
    let next = Math.round((castIntervalTicks(p, support) + carry) * 1000000) / 1000000;
    return Math.max(0.000001, next);
}   // 🔮 小數施法間隔補差：例如 7.5 tick 會交替 8/7 tick，長期維持 80 次／分。
// 防具強化 → AC 減免量（值越大防禦越好）：v3.0.69 用戶要求改「線性·每 +1 固定 AC−1」（原 +11~+15 每階多給 +2 已取消→ +11 以上不再大幅提升，每階仍只 −1；+15＝AC−15）。
function enhanceArmAc(en) {
    return Math.max(0, Number(en) || 0);   // 每 +1 固定 AC−1
}

// ===== 🏛️ 傳統模式（⚠️v3.0.83 已取消）=====
//  一般+傳統已併入一般、經典+傳統已併入經典：舊角色 loadGame 時清除 traditionalMode 旗標（js/13）；
//  共用倉庫/圖鑑桶（'_tradonly'/'_trad'）由 _mergeTradBuckets 一次性併入對應模式桶（js/12）。
//  舊機制（無強化選項／封鎖施法卷軸／掉落自帶強化值 TRAD_EN_TABLES）全數移除；
//  兩個判定函式保留恆 false，讓殘留呼叫點安全短路（_tradLootCtx set/restore 站點亦保留但已無消費者）。
function traditionalActive(){ return false; }
function tradNoScrolls(){ return false; }

// ===== 🔧 v3.0.79 物品/裝備說明隱藏骰子公式（使用者要求：XDX 之類公式不顯示；載入時就地改寫 d 文字·不影響實際傷害計算）=====
{
    const _dSmall = /（小型1D\d+、大型1D\d+）/g;            // 沙哈之箭彈藥骰（整段括號移除）
    const _dBase  = /基礎傷害 \d+D\d+(?:\+\d+)?[。，]?/g;    // 「基礎傷害 5D7。」整句移除（後續文字保留）
    const _dOf    = /基礎 \d+D\d+(?:\+\d+)? 的/g;            // 「基礎 5D5+5 的」
    const _dAny   = / ?\d+D\d+(?:\+\d+)? ?/g;                // 其餘「6D10 」「3D20 」「3D6 」
    for (const _k in DB.items) {
        const _it = DB.items[_k];
        if (!_it || typeof _it.d !== 'string' || !/\dD\d/.test(_it.d)) continue;
        _it.d = _it.d.replace(_dSmall, '').replace(_dBase, '').replace(_dOf, '').replace(_dAny, '').replace(/。。+/g, '。').replace(/  +/g, ' ');
    }
}


// ===== 🏺 v3.8.38 遺物補全：普通裝備的固定強力變體（初始化一次，不在擊殺時生成） =====
// 對應表是固定存檔 ID 的來源；往後新增其他遺物也不能移除已發布的物品定義。
// 同名怪物共用 MOB_DROPS；只列可實際結算掉落的最終形態，不為 NPC、建築或寶箱產物。
const RELIC_EQUIPMENT_VARIANTS = [
    ["skel_spear","wpn_4","slow"], // 骷髏槍兵 → 矛
    ["ant_giant_white","arm_108","mend"], // 巨大白螞蟻 → 塔盾
    ["tomb_guardian","arm_108","spines"], // 墳墓守護者 → 塔盾
    ["sanct_cursed_fighter","wpn_dual_spike","disease"], // 受詛咒的黑暗妖精鬥士 → 尖刺雙刀
    ["sanct_cursed_mage","amr_darkmage_robe","spirit"], // 受詛咒的黑暗妖精法師 → 黑法師長袍
    ["sanct_cursed_knight","wpn_sword_rasta","silence"], // 受詛咒的黑暗妖精騎士 → 拉斯塔巴德長劍
    ["sanct_scavenger","wpn_claw_steel","poison"], // 食腐獸 → 鋼鐵鋼爪
    ["sanct_tethys","arm_stone_glove","bastion"], // 特提斯 → 石製手套
    ["iv_armor","amr_plate","spines"], // 象牙塔活鎧甲 → 金屬盔甲
    ["demon_assassin","wpn_dagger_rasta","poison"], // 魔族暗殺團 → 拉斯塔巴德短劍
    ["ant_kama_nan","glv_fire_spirit","emberguard"], // 喀瑪南 → 火靈手套
    ["flame_baless","wpn_powerless_baless","flame"], // 炎魔的巴列斯 → 失去魔力的巴列斯魔杖
    ["ant_kama_flame","glv_water_spirit","coldguard"], // 喀瑪焰 → 水靈手套
    ["thebes_anus","blt_thebes_osiris","rebirth"], // 底比斯 阿努斯 → 底比斯歐西里斯腰帶
    ["pride_small_phantom","shd_illu_book","mirror"], // 小幻象眼魔 → 幻術士法書
    ["sanct_wyvern","clk_pride_wind","stormguard"], // 翼龍 → 風屬性斗篷
    ["de_elder_captain","wpn_dual_spike","stun"], // 拉斯塔巴德近衛隊隊長 → 尖刺雙刀
    ["death_priest_baphomet","amr_priest","rebirth"], // 死亡的司祭(巴風特) → 神官法袍
    ["chaos_priest_beast","wpn_hate_claw","disease"], // 混沌的司祭(野獸) → 恨之鋼爪
    ["iv_deathsword","wpn_dark_sword","vampire"], // 象牙塔死亡之劍 → 黑暗之劍
    ["iv_chimera","amr_centipede","purify"], // 象牙塔奇美拉 → 金屬蜈蚣皮盔甲
    ["iv_elder","acc_125","spirit"], // 象牙塔長者 → 長老項鍊
    ["iv_lightball","rng_wind","mirror"], // 象牙塔閃電球 → 風靈戒指
    ["abyss_water","glv_water_spirit","coldguard"], // 深淵水靈 → 水靈手套
    ["abyss_fire","glv_fire_spirit","emberguard"], // 深淵火靈 → 火靈手套
    ["abyss_wind","glv_wind_spirit","stormguard"], // 深淵風靈 → 風靈手套
    ["pride_iris_mob","arm_99","mirror"], // 艾莉絲 → 力量手套
    ["pride_terror_zombie_king","arm_99","purify"], // 恐怖的殭屍王 → 力量手套
    ["iv_lamia","acc_131","purify"], // 象牙塔蛇女 → 靈魂腰帶
    ["thebes_anus_b","blt_thebes_osiris","rebirth"], // 底比斯 阿努斯(黑) → 底比斯歐西里斯腰帶
    ["pride_marcus_vampire","wpn_chain_bloodthirst","vampire"], // 馬昆斯吸血鬼 → 嗜血者鎖鏈劍
    ["tomb_guardian_giant","arm_108","spines"], // 巨大墳墓守護者 → 塔盾
    ["iv_blackelder","wpn_witchwand","thunder"], // 象牙塔黑長者 → 巫術魔法杖
    ["flame_avatar","wpn_demon_axe","fireball"], // 炎魔的分身 → 惡魔斧頭
    ["iv_reaper","glv_reaper","spirit"], // 象牙塔死神 → 死神之手
    ["iv_blackmage","acc_demonbane","spirit"], // 象牙塔黑魔法師 → 滅魔戒指
    ["iv_shadow","clk_dark","mirror"], // 象牙塔影魔 → 黑暗斗篷
    ["thebes_bas","blt_thebes_osiris","mirror"], // 底比斯 巴斯 → 底比斯歐西里斯腰帶
    ["pride_mummy_king_mob","rng_earth","rebirth"], // 木乃伊王 → 地靈戒指
    ["iv_flameslave","shd_priest_book","flameguard"], // 象牙塔炎魔的奴隸 → 神官魔法書
    ["iv_spirit","amr_robe","spirit"], // 象牙塔惡靈 → 綿質長袍
    ["iv_imp","wpn_demon_axe","flame"], // 象牙塔小惡魔 → 惡魔斧頭
    ["iv_baless","wpn_powerless_baless","fireball"], // 象牙塔巴列斯之影 → 失去魔力的巴列斯魔杖
    ["thebes_bas_r","blt_thebes_osiris","mirror"], // 底比斯 巴斯(紅) → 底比斯歐西里斯腰帶
    ["pride_earth_king","rng_earth","bastion"], // 土精靈王 → 地靈戒指
    ["pride_water_king","rng_water","coldguard"], // 水精靈王 → 水靈戒指
    ["pride_fire_king","rng_fire","emberguard"], // 火精靈王 → 火靈戒指
    ["pride_wind_king","rng_wind","stormguard"], // 風精靈王 → 風靈戒指
    ["iv_hatin","wpn_demon_sword","thunder"], // 哈汀之影 → 惡魔之劍
    ["pride_vander_mob","wpn_siruge","stun"], // 騎士范德 → 瑟魯基之劍
    ["pride_phantom_boss","wpn_crystal_dagger","stone"], // 不幸的幻象眼魔 → 水晶短劍
    ["pride_jenis","acc_138","purify"], // 扭曲的潔尼斯女王 → 守護皮帶
    ["pride_vampire_boss","arm_87","rebirth"], // 恐怖的吸血鬼 → 保護者斗篷
    ["iv_wing","clk_pride_wind","stormguard"], // 象牙塔翼魔 → 風屬性斗篷
    ["flame_demon","wpn_hate_claw","fireball"], // 炎魔的惡魔 → 恨之鋼爪
    ["de_king_slayer","wpn_assassin_mark","poison"], // 暗殺軍王史雷佛 → 暗殺軍王之痕
    ["iv_baphomet","wpn_powerless_baphomet","earthquake"], // 象牙塔巴風特之影 → 失去魔力的巴風特魔杖
    ["ant_earth_wild_dragon","armguard_dragonscale","bastion"], // 大地荒龍 → 龍鱗臂甲
    ["ant_kama_nan_king","glv_fire_spirit","emberguard"], // 喀瑪南王 → 火靈手套
    ["ant_kama_flame_king","glv_water_spirit","coldguard"], // 喀瑪焰王 → 水靈手套
    ["pride_zombie_king","blt_mr","rebirth"], // 死亡的殭屍王 → 抗魔皮帶
    ["iv_flameshadow","clk_pride_fire","emberguard"], // 象牙塔炎魔之影 → 火屬性斗篷
    ["iv_demonshadow","wpn_demon_dual","fireball"], // 象牙塔惡魔之影 → 惡魔雙刀
    ["de_king_baranka","wpn_baranka_claw","broken"], // 魔獸軍王巴蘭卡 → 魔獸軍王之爪
    ["flameshadow_guard_baphomet","shd_priest_book","mend"], // 火焰之影親衛隊(巴風特) → 神官魔法書
    ["pride_mummy_king","rng_earth","rebirth"], // 不死的木乃伊王 → 地靈戒指
    ["pride_panther_boss","wpn_claw_abyss","stun"], // 地獄的黑豹 → 暗黑鋼爪
    ["pride_iris_boss","arm_99","mirror"], // 冷酷的艾莉絲 → 力量手套
    ["de_king_laia","amr_laia_robe","coldguard"], // 法令軍王蕾雅 → 蕾雅長袍
    ["abyss_lord","acc_abyss_ring","spirit"], // 深淵之主 → 深淵戒指
    ["fallen_boss","blt_mr","rebirth"], // 墮落 → 抗魔皮帶
    ["phoenix","wpn_redflame_bow","fireball"], // 不死鳥 → 赤焰之弓
    ["ant_kama_king","wpn_qigu_obsidian","earthquake"], // 喀瑪王 → 黑曜石奇古獸
    ["giant_ancient","wpn_greatsword","stun"], // 古代巨人 → 巨劍
    ["ant_queen","wpn_ancient_elf_xbow","poison"], // 巨蟻女皇 → 古代妖精弩槍
    ["ice_demon","wpn_crystal_dagger","freeze"], // 冰魔 → 水晶短劍
    ["death_boss","wpn_iron_axehead","vampire"], // 死亡 → 鐵斧頭
    ["thebes_anubis","blt_thebes_osiris","rebirth"], // 底比斯 阿努比斯 → 底比斯歐西里斯腰帶
    ["thebes_horus","amu_int","stormguard"], // 底比斯 賀洛斯 → 智力項鍊
    ["de_king_heruby","shd_priest_book","mend"], // 冥法軍王海露拜 → 神官魔法書
    ["chaos_boss","wpn_chaos_thorn","disease"], // 混沌 → 混沌之刺
    ["nm_034","wpn_2hsword","flame"], // 惡魔 → 雙手劍
    ["ice_queen","glv_crystal","coldguard"], // 冰之女王 → 水晶手套
    ["pride_vander_boss","wpn_siruge","stun"], // 闇黑的騎士范德 → 瑟魯基之劍
    ["de_elder_kina","amr_laia_robe","mirror"], // 長老．琪娜 → 蕾雅長袍
    ["pride_lich_boss","clk_silver_light","spirit"], // 不滅的巫妖 → 銀光斗篷
    ["pride_reaper_boss","wpn_dual_abyss","vampire"], // 邪惡的鐮刀死神 → 暗黑雙刀
    ["de_elder_adiel","glv_dark","purify"], // 長老．艾迪爾 → 黑暗手套
    ["de_elder_batas","wpn_dual_spike","broken"], // 長老．巴塔斯 → 尖刺雙刀
    ["de_elder_balos","wpn_red_crystalwand","thunder"], // 長老．巴洛斯 → 紅水晶魔杖
    ["de_elder_taimas","wpn_blood_2hsword","vampire"], // 長老．泰瑪斯 → 血色巨劍
    ["lindvior","clk_pride_wind","stormguard"], // 林德拜爾 → 風屬性斗篷
    ["de_elder_andis","wpn_official_blade","silence"], // 長老．安迪斯 → 武官之刃
    ["de_elder_ramas","wpn_claw_dark","poison"], // 長老．拉曼斯 → 黑暗鋼爪
    ["fafurion","acc_131","coldguard"], // 法利昂 → 靈魂腰帶
    ["antaras","amr_plate","bastion"], // 安塔瑞斯 → 金屬盔甲
    ["valakas","wpn_qigu_resonance","firestorm"], // 巴拉卡斯 → 共鳴奇古獸
    ["ant_antharas_mad","wpn_claw_abyss","collapse"], // 被侵蝕的瘋狂安塔瑞斯 → 暗黑鋼爪
    ["de_elder_balud","wpn_red_crystalwand","firestorm"], // 長老．巴陸德 → 紅水晶魔杖
    ["sanct_giltas","wpn_official_blade","collapse"], // 吉爾塔斯 → 武官之刃
];
(function initRelicEquipmentVariants() {
    const positive = value => Number.isFinite(value) ? Math.max(0, value) : 0;
    const meanRoll = dice => Array.isArray(dice) ? positive(dice[0]) * (positive(dice[1]) + 1) / 2 : 0;
    function powerOf(mob) {
        const lv = Math.max(1, positive(mob.lv));
        let pressure = (meanRoll(mob.dmg) + positive(mob.db)) / Math.max(0.5, positive(mob.atkSpd));
        for (const key of ['mag', 'mag2', 'mag3']) {
            const skill = mob[key];
            if (!skill) continue;
            const hit = (meanRoll(skill.dmg) + positive(skill.db)) * Math.max(1, positive(skill.times));
            const dot = positive(skill.d) * Math.max(1, positive(skill.dur) / Math.max(1, positive(skill.tick)));
            pressure += (hit + dot) / Math.max(1, positive(skill.cd) / 10);
        }
        // 等級與頭目分帶為主，血量、攻擊壓力與防禦補足同級差異。
        // 僅轉成固定能力預算；不修改怪物、觸發機率、冷卻或職業限制。
        return Math.round(lv + (mob.boss ? 12 : 0)
            + 2 * Math.log2(1 + positive(mob.hp) / (50 + lv * 10))
            + 3 * Math.log2(1 + pressure / 10)
            + positive(-mob.ac) / 40 + positive(mob.mr) / 75 + positive(mob.dr) / 10);
    }
    // 每件新增遺物都有獨立特殊效果；沿用既有觸發通道，不增加戰鬥輪詢或遞迴施法。
    // 原裝備的 eff／共鳴／雙擊等保留；procSkill2 是既有第二施法槽，適用一般武器與奇古獸。
    const spellEffects = {
        fireball: 'sk_fireball', flame: 'sk_blaze', thunder: 'sk_thunder',
        earthquake: 'sk_earthquake', vampire: 'sk_vampire',
        firestorm: 'sk_fire_storm', collapse: 'sk_earth_collapse'
    };
    const statusEffects = {
        stun: 'sk_relic_stun', freeze: 'sk_relic_freeze', slow: 'sk_relic_slow',
        silence: 'sk_relic_silence', stone: 'sk_relic_stone', broken: 'sk_relic_broken', disease: 'sk_disease'
    };
    function specialEffect(key, power) {
        const tier = Math.min(5, Math.max(1, Math.floor(power / 30)));
        if (spellEffects[key]) return { procSkill2: { skId: spellEffects[key],
            rate: key === 'firestorm' || key === 'collapse' ? 3 + Math.floor(tier / 2) : 4 + tier } };
        if (statusEffects[key]) return { procStatusSkill: { skId: statusEffects[key],
            rate: key === 'disease' ? 4 + tier : 1 + Math.floor(power / 55) } };
        switch (key) {
            case 'poison': return { procPoison: { rate: 8 + tier * 2, dmg: [6 + tier * 4, 1], dur: 6, tick: 1 } };
            case 'mend': return { onDmgHeal: power < 80 ? 'sk_heal1' : 'sk_heal_mid', onDmgHealCd: Math.max(5, 9 - tier) };
            case 'spines': return { thorns: 4 + tier * 3, physDrGated: 8 + tier * 2 };
            case 'bastion': return { physDrGated: 10 + tier * 3, thorns: tier * 2 };
            case 'mirror': return { dmgReflect: 2 + tier };
            case 'purify': return { statusHealHp: 10 + tier * 8 };
            case 'spirit': return { dotMpRefund: 10 + tier * 3 };
            case 'flameguard': return { fireNullify: true };
            case 'emberguard': return { fireNullify: true, thorns: tier * 2 };
            case 'coldguard': return { statusHealHp: 10 + tier * 6, dmgReflect: 2 + tier };
            case 'stormguard': return { dmgReflect: 2 + tier, dotMpRefund: 10 + tier * 2 };
            case 'rebirth': return { statusHealHp: 15 + tier * 10, dotMpRefund: 10 + tier * 2 };
            default: throw new Error('Unknown relic special effect: ' + key);
        }
    }

    for (const [mobId, baseId, effectKey] of RELIC_EQUIPMENT_VARIANTS) {
        const mob = DB.mobs[mobId], base = DB.items[baseId];
        if (!mob || !base || base.relic || base.legend || !['wpn', 'arm', 'acc'].includes(base.type)
            || base.isArrow || base.slot === 'petwpn' || base.slot === 'petarm')
            throw new Error('Invalid relic equipment source: ' + mobId + '/' + baseId);
        const id = 'relic_echo_' + mobId;
        if (DB.items[id]) throw new Error('Duplicate relic equipment ID: ' + id);
        const power = powerOf(mob);
        const item = JSON.parse(JSON.stringify(base));
        Object.assign(item, {
            n: mob.n + '的' + base.n,
            img: getIconUrl(base),
            relic: true, noEnhance: true, gachaWeight: 0, p: 10000,
            relicBaseId: baseId, relicSourceId: mobId, relicPower: power, relicEffectKey: effectKey,
            d: '【遺物】' + mob.n + '遺留的' + base.n + '，在戰鬥中凝聚了超越原型的力量。'
        });
        delete item._spdFam;
        // 只增加已知正向能力；原型的技能、機率、負面效果與裝備條件完整保留。
        const add = (key, amount) => {
            const value = Number(item[key]) || 0;
            if (amount > 0 && value >= 0) item[key] = value + amount;
        };
        if (base.type === 'wpn') {
            add('dmgS', Math.ceil(power / 20)); add('dmgL', Math.ceil(power / 20));
            add('hit', Math.ceil(power / 12)); add('dmgBonus', Math.ceil(power / 8));
            if (base.qigu || base.isWand || base.extraMp || /杖|水晶球/.test(base.n)) {
                add('extraMp', Math.ceil(power / 20)); add('mdmg', Math.floor(power / 40));
            }
        } else if (base.type === 'arm') {
            add('ac', Math.ceil(power / 15)); add('dr', Math.floor(power / 35));
            add('mr', Math.ceil(power / 10)); add('mhp', 5 * Math.ceil(power / 10));
        } else {
            add('ac', Math.floor(power / 30)); add('dr', Math.floor(power / 40));
            add('mr', Math.ceil(power / 10)); add('mhp', 5 * Math.ceil(power / 10));
            add('extraDmg', Math.floor(power / 25)); add('extraHit', Math.floor(power / 25));
        }
        const effects = specialEffect(effectKey, power);
        for (const key of Object.keys(effects)) {
            if (base[key] !== undefined) throw new Error('Relic effect conflicts with base: ' + id + '/' + key);
        }
        Object.assign(item, effects);
        DB.items[id] = item;
        ITEM_WEIGHTS[item.n] = ITEM_WEIGHTS[base.n] || 0;
        const drops = MOB_DROPS[mob.n] || (MOB_DROPS[mob.n] = []);
        if (!drops.some(drop => drop[0] === id)) drops.push([id, 0.0001]);
    }
})();
