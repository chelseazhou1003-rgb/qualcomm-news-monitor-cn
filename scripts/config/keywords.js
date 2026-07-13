// Chinese keyword configuration for Qualcomm news monitoring
// Uses jieba segmentation for precise Chinese keyword matching

// === Primary filter keywords — article must contain at least one ===
export const QUALCOMM_KEYWORDS = [
  '高通',
  'QCOM',
  '安蒙',
  '骁龙',
];

// === Conditional keywords — only count with Qualcomm brand mention ===
export const CONDITIONAL_KEYWORDS = [
  '3GPP',
  'FRAND',
  'SEP',
  '标准必要专利',
];

// === Geopolitical bypass keywords — articles pass filter without Qualcomm mention ===
// These articles are restricted to Macro section only (see tag.js)
// NOTE: Some geopolitical keywords (制裁, 中美) are too broad and can match non-semiconductor articles.
// To prevent false positives, the bypass also requires a SECONDARY context keyword
// confirming the article is actually about semiconductor/tech policy.
export const GEOPOLITICAL_KEYWORDS = [
  '出口管制',
  '制裁',
  '贸易战',
  '关税',
  '芯片法案',
  '实体清单',
  'BIS',
  '商务部',
  '芯片禁令',
  '国家安全',
  '脱钩',
  '中美',
  '技术冷战',
  '进口禁令',
  '双重用途',
  'CHIPS Act',
];

// Secondary context keywords required for geopolitical bypass to activate.
// Prevents false positives from non-semiconductor articles that happen to mention
// broad terms like "中美" or "制裁" (e.g., AI industry articles).
export const GEOPOLITICAL_CONTEXT_KEYWORDS = [
  '芯片',
  '半导体',
  '出口管制',
  'BIS',
  '实体清单',
  '技术出口',
  '技术封锁',
  '科技战',
  '芯片战',
  '卡脖子',
  '技术禁令',
  '晶圆',
  '处理器',
  'SoC',
];

// === Competitor keywords — only Apple and Huawei, both require IP/Patent/SEP co-occurrence ===
export const COMPETITOR_KEYWORDS = {
  apple: ['苹果'],
  huawei: ['华为'],
};

export const COMPETITOR_CONDITIONS = {
  apple: ['专利', 'IP', 'SEP'],
  huawei: ['专利', 'IP', 'SEP'],
};

// === Stakeholder keywords ===
export const STAKEHOLDER_KEYWORDS = {
  '3gpp': ['3GPP', '第三代合作伙伴计划'],
  etsi: ['ETSI', '欧洲电信标准化协会'],
  ieee: ['IEEE', '电气电子工程师学会'],
  'wi-fi-alliance': ['Wi-Fi联盟', 'WiFi联盟'],
  'bluetooth-sig': ['蓝牙SIG', '蓝牙技术联盟'],
  'usb-if': ['USB-IF', 'USB开发者论坛'],
  'o-ran': ['O-RAN', '开放RAN', 'Open RAN'],
  regulators: ['FTC', '联邦贸易委员会', '欧盟委员会', '国家发改委', '市场监管总局', '反垄断局'],
  'industry-assoc': ['SIA', '半导体行业协会', 'GSMA', 'SEMI'],
  oem: ['三星', '小米', 'OPPO', 'vivo', '荣耀', '摩托罗拉', '联想', '戴尔', '惠普', '华硕', '宏碁'],
  foundry: ['台积电', '三星代工', '英特尔代工', '格罗方德', '联华电子', '中芯国际'],
  'platform-partner': ['微软', '谷歌', 'Meta', '亚马逊', 'AWS', 'Windows on Arm', 'WoA'],
};

// === Section keyword maps for automatic tagging ===
export const SECTION_KEYWORDS = {
  'core-businesses': {
    name: '核心业务',
    subs: {
      semiconductors: ['芯片', '晶圆', '半导体', '制程', '纳米', 'FinFET', 'GAA', '封装', '晶圆代工', '硅', '晶粒', '晶体管', '先进封装', '3D封装', 'chiplet'],
      wireless: ['5G', '6G', '排名', '领导力', '3GPP', 'Wi-Fi', 'WiFi', 'Dragonfly'],
      'mobile-chips': ['骁龙8', '骁龙7', '移动平台', '手机芯片', '旗舰', '手机', '移动'],
      'pc-chips-computing': ['X Elite', 'X Plus', 'Windows on Arm', 'WoA', 'PC芯片', '笔记本芯片', 'PC'],
      automotive: ['骁龙Ride', '数字座舱', '座舱', '车联网', '远程信息处理', 'V2X', 'C-V2X', '车规级', '自动驾驶', '汽车'],
      'iot-xr': ['IoT', '骁龙AR', '骁龙XR', 'XR2', 'AR2', '可穿戴', '智能手表', '嵌入式', '边缘设备', 'Dragonwing', 'XR'],
    },
  },
  'ip-legal': {
    name: '知识产权与法律',
    subs: {
      sep: ['SEP', '标准必要专利'],
      ip: ['专利', 'IP组合', '知识产权', '专利申请'],
      'patent-litigation': ['诉讼', '侵权', '起诉', '官司', '法院', 'ITC', '禁令', '赔偿', '陪审团'],
      'frand-licensing': ['FRAND', '授权', '版税', '许可', '交叉许可', '专利池', 'Avanci', 'HEVC', 'VVC'],
      'regulatory-antitrust': ['反垄断', '竞争法', '垄断', '市场支配地位', '同意令', 'FTC'],
    },
  },
  'growth-areas': {
    name: '增长领域',
    subs: {
      'on-device-ai': ['端侧AI', '边缘AI', '端侧推理', 'Hexagon NPU', 'AI引擎', '神经处理', 'NPU', '端侧人工智能'],
      'ai-pc': ['AI PC', 'Copilot', 'AI笔记本', 'NPU TOPS', 'AI TOPS', 'AI计算', '本地AI'],
      'embodied-ai-robotics': ['具身智能', '机器人', '人形机器人', '自主机器', '机器人芯片', '机器视觉', 'SLAM'],
      'in-vehicle-infotainment-adas': ['车载', '信息娱乐', '数字座舱', 'ADAS', '自动驾驶', '驾驶辅助', '驾驶员监控'],
      'xr-spatial-computing': ['空间计算', 'XR', 'AR眼镜', 'VR头显', '混合现实', '骁龙Spaces', '手势追踪', 'MR头显'],
      'data-center': ['数据中心', 'AI服务器', '云服务器', '服务器芯片', '服务器CPU', '超大规模数据中心', '云基础设施'],
    },
  },
  'macro-environment': {
    name: '宏观环境',
    subs: {
      'customers-partners': ['OEM', '合作伙伴', '合作', '客户', '设计导入', '供应协议', '多年协议', '联合开发', '协同工程'],
      'supply-chain': ['供应链', '产能', '良率', '晶圆', '短缺', '交货期', '库存', '采购', '双源采购'],
      'geopolitics-export-controls': GEOPOLITICAL_KEYWORDS,
      'market-performance': ['股价', '估值', '财报', '市值', '指数', '纳斯达克', 'QCOM股票', '投资者', '股票', '收盘', '交易时段', '股票市场'],
    },
  },
  competitors: {
    name: '竞争对手',
    subs: {
      apple: ['苹果'],
      huawei: ['华为'],
    },
  },
  stakeholders: {
    name: '关键利益相关方',
    subs: {
      '3gpp': ['3GPP'],
      etsi: ['ETSI'],
      ieee: ['IEEE'],
      'wi-fi-alliance': ['Wi-Fi联盟', 'WiFi联盟', 'Wi-Fi 7', 'Wi-Fi 6E'],
      'bluetooth-sig': ['蓝牙SIG', '蓝牙6', '蓝牙5'],
      'usb-if': ['USB-IF', 'USB4', 'USB 3'],
      'o-ran': ['O-RAN', '开放RAN'],
      regulators: ['FTC', '欧盟委员会', '反垄断监管机构'],
      'industry-assoc': ['SIA', 'GSMA', 'SEMI', '行业协会'],
      oem: ['手机厂商', '手机制造商', 'OEM合作伙伴', '终端厂商'],
      foundry: ['台积电', '三星代工', '格罗方德', '中芯国际'],
      'platform-partner': ['微软', '谷歌', 'Meta', '亚马逊', 'Windows on Arm'],
    },
  },
};
