export interface FileItem {
  id: string;
  name: string;
  type: 'file';
  size: string;
  date: string;
  content?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder';
  date: string;
  children: (FolderItem | FileItem)[];
}

export interface Project {
  id: string;
  code: string;
  name: string;
  letter: string;
  type: 'TPR' | 'FINA';
  starred: boolean;
  color: string; // 'charcoal' | 'blue'
  summary: string;
  filesCount: number;
  rootFolder?: FolderItem;
}

export const mockProjects: Project[] = [
  {
    id: 'project-1',
    code: '投前0620',
    name: '投前0620',
    letter: '投',
    type: 'TPR',
    starred: true,
    color: 'charcoal',
    summary: '搭建完整的投前流程体系：从商机上报 → 商机识别/写报告 → 报告评审 → 立项会 → 内审会 → ... 审，并用斯乐丰米单抗（GR1801）项目作为实践样本验证机制可跑',
    filesCount: 14,
    rootFolder: {
      id: 'root',
      name: '投前0620',
      type: 'folder',
      date: '26/06/21',
      children: [
        {
          id: 'f-01',
          name: '01-discovery',
          type: 'folder',
          date: '26/06/21',
          children: [
            {
              id: 'file-disc-1',
              name: '01-商机挖掘与分析.md',
              type: 'file',
              size: '42 KB',
              date: '26/06/21',
              content: '# 商机挖掘与分析\n\n本章节包含投前阶段商机的搜集、筛选和初步分析工作。重点围绕市场趋势和潜在标的进行分析。'
            },
            {
              id: 'file-disc-2',
              name: '02-行业竞品调研报告.md',
              type: 'file',
              size: '128 KB',
              date: '26/06/21',
              content: '# 行业竞品调研报告\n\n针对当前行业主要竞争对手的产品定位、市场占有率及商业模式进行深度拆解。'
            }
          ]
        },
        {
          id: 'f-02',
          name: 'references',
          type: 'folder',
          date: '26/06/21',
          children: [
            {
              id: 'f-02-1',
              name: 'cms_org',
              type: 'folder',
              date: '26/06/21',
              children: [
                {
                  id: 'f-02-1-1',
                  name: 'CMS组织架构',
                  type: 'folder',
                  date: '26/06/21',
                  children: [
                    {
                      id: 'f-prod-center',
                      name: '03-产品中心',
                      type: 'folder',
                      date: '26/06/21',
                      children: [
                        {
                          id: 'f-prod-1',
                          name: '产品规划书.md',
                          type: 'file',
                          size: '15 KB',
                          date: '26/06/21',
                          content: '# 产品规划书\n\n产品中心关于核心业务线的中长期产品迭代与功能规划，包含里程碑目标和KPI要求。'
                        }
                      ]
                    },
                    {
                      id: 'f-shenxikang',
                      name: '08-深西康',
                      type: 'folder',
                      date: '26/06/21',
                      children: [
                        {
                          id: 'f-shen-1',
                          name: '深西康协作机制.md',
                          type: 'file',
                          size: '22 KB',
                          date: '26/06/21',
                          content: '# 深西康协作机制\n\n规范深西康与各业务部门之间的对接流程及信息流转通道。'
                        }
                      ]
                    },
                    {
                      id: 'f-demei',
                      name: '09-德镁医药',
                      type: 'folder',
                      date: '26/06/21',
                      children: [
                        {
                          id: 'f-demei-1',
                          name: '德镁医药项目推进表.md',
                          type: 'file',
                          size: '18 KB',
                          date: '26/06/21',
                          content: '# 德镁医药项目推进表\n\n记录德镁医药专项工作的时间节点、责任人及当前完成状态。'
                        }
                      ]
                    },
                    {
                      id: 'f-out-of-hosp',
                      name: '11-院外业务中心',
                      type: 'folder',
                      date: '26/06/21',
                      children: [
                        {
                          id: 'f-out-1',
                          name: '院外业务拓展规划.md',
                          type: 'file',
                          size: '35 KB',
                          date: '26/06/21',
                          content: '# 院外业务拓展规划\n\n细化零售药房、DTP药房等院外渠道的合作模式与网络布局方案。'
                        }
                      ]
                    },
                    {
                      id: 'f-indexes',
                      name: '_indexes',
                      type: 'folder',
                      date: '26/06/21',
                      children: [
                        {
                          id: 'f-idx-1',
                          name: '索引元数据.md',
                          type: 'file',
                          size: '8 KB',
                          date: '26/06/21',
                          content: '# 索引元数据\n\n用于全局检索及版本对照的元数据规范文件。'
                        }
                      ]
                    },
                    {
                      id: 'file-00',
                      name: '00-集团通用.md',
                      type: 'file',
                      size: '91 KB',
                      date: '26/06/21',
                      content: '# 00-集团通用\n\n本文档包含集团通用组织架构及职责分工核心规范。\n\n## 1. 部门总体职责\n集团各部门须严格按照流程体系履行以下职责：\n- **战略规划部**：负责商机挖掘与分析、宏观产业研究，牵头投前尽调。\n- **财经中心**：负责全面预算管理、资金统筹及投后财务监控。\n- **人力资源中心**：负责核心团队组织架构诊断、激励方案制定及高管选聘。\n\n## 2. 跨部门决策机制\n在投前决策过程中，各关键节点需多方协同：\n1. 商机挖掘阶段由战略规划部牵头。\n2. 财务及合规性审核由财经中心把关。\n3. 重大决策进入投决会前，由风险合规部、法务部联合出具评审意见。'
                    },
                    {
                      id: 'file-01',
                      name: '01-人力资源中心.md',
                      type: 'file',
                      size: '72 KB',
                      date: '26/06/21',
                      content: '# 01-人力资源中心规范\n\n## 1. 目标与范围\n规范集团及下属公司人力资源管理架构，优化审批权限流转，提升人效比。\n\n## 2. 关键组织职责\n- **组织发展组(OD)**：负责定岗定编、职级体系维护。\n- **招聘调配组**：负责核心专家及管理干部猎聘、背景调查。\n- **薪酬绩效组**：负责季度/年度绩效考评管理及奖金系数测算。'
                    },
                    {
                      id: 'file-02',
                      name: '02-财经中心.md',
                      type: 'file',
                      size: '37 KB',
                      date: '26/06/21',
                      content: '# 02-财经中心管理细则\n\n## 1. 资金出纳与流转\n所有大额投前费用及项目意向金，均须严格履行三级审批流程：\n- 项目责任人申请\n- 财经中心负责人初审\n- 集团分管高管终审\n\n## 2. 税务与核算规范\n针对各子项目设立独立的财务科目进行专项核算，确保合规性。'
                    },
                    {
                      id: 'file-04',
                      name: '04-经营管理中心.md',
                      type: 'file',
                      size: '37 KB',
                      date: '26/06/21',
                      content: '# 04-经营管理中心运营机制\n\n## 1. 核心职责\n- 运营数据监控：按周、按月输出核心业务指标看板。\n- 跨板块协同：督办跨部门重点项目，确保战略目标落地。\n\n## 2. 汇报机制\n每周一上午九点召开跨板块运营例会，通报红黄绿灯预警状态。'
                    },
                    {
                      id: 'file-05',
                      name: '05-供应链中心.md',
                      type: 'file',
                      size: '97 KB',
                      date: '26/06/21',
                      content: '# 05-供应链中心管理手册\n\n## 1. 采购与供应商管理\n- 准入审核：供应商须通过合规与质量双重现场审计。\n- 考核机制：每季度对核心供应商进行QSTC（质量、服务、技术、成本）考评。\n\n## 2. 物流与仓储\n严格执行GSP（药品经营质量管理规范）标准，实现全链条温湿度监控。'
                    },
                    {
                      id: 'file-06',
                      name: '06-生产与质量中心.md',
                      type: 'file',
                      size: '28 KB',
                      date: '26/06/21',
                      content: '# 06-生产与质量中心规定\n\n## 1. 质量第一原则\n任何产品出厂前，须经质量受权人（QP）签字确认，实行质量一票否决制。\n\n## 2. 生产调度与安全\n严格遵守安全生产责任制，定期开展安全隐患排查。'
                    },
                    {
                      id: 'file-07',
                      name: '07-执行董事层直管部门.md',
                      type: 'file',
                      size: '21 KB',
                      date: '26/06/21',
                      content: '# 07-执行董事层直管部门管理职责\n\n直管部门（如董事会办公室、内审合规部）直呈执行董事：\n- **内审合规**：独立行使审计职权，负责反舞弊与风险穿透审查。\n- **董办**：负责三会（股东会、董事会、监事会）召集与合规信息披露。'
                    },
                    {
                      id: 'file-10',
                      name: '10-康哲维盛.md',
                      type: 'file',
                      size: '147 KB',
                      date: '26/06/21',
                      content: '# 10-康哲维盛业务白皮书\n\n康哲维盛致力于构建新型数字医疗与慢病健康管理闭环：\n- 核心学术推广策略\n- 慢病慢开管理平台运营要点\n- 线上线下协同诊疗规范流程'
                    },
                    {
                      id: 'file-readme',
                      name: 'README.md',
                      type: 'file',
                      size: '3 KB',
                      date: '26/06/21',
                      content: '# CMS组织架构说明\n\n本目录整理了CMS体系下各职能中心、业务单元的职责边界和协作机制文档。\n请在日常流程审批与跨部门协作中作为标准参照。'
                    }
                  ]
                }
              ]
            },
            {
              id: 'f-02-2',
              name: 'cms_v3',
              type: 'folder',
              date: '26/06/21',
              children: [
                {
                  id: 'file-v3-1',
                  name: 'v3-架构优化设想.md',
                  type: 'file',
                  size: '12 KB',
                  date: '26/06/21',
                  content: '# v3-架构优化设想\n\n关于下一代流程体系更扁平、更敏捷的设计方案初稿。'
                }
              ]
            }
          ]
        },
        {
          id: 'f-03',
          name: '02-planning',
          type: 'folder',
          date: '26/06/21',
          children: [
            {
              id: 'file-plan-1',
              name: '项目总体排期表.md',
              type: 'file',
              size: '14 KB',
              date: '26/06/21',
              content: '# 项目总体排期表\n\n投前0620项目关键里程碑排期：\n- 第一阶段：商机调研与体系搭建 (截至7月底)\n- 第二阶段：样本项目验证运行 (截至9月中)\n- 第三阶段：流程优化与全面推行 (截至10月底)'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'project-2',
    code: 'FINA-20260410-001',
    name: 'FINA-20260410-001',
    letter: 'F',
    type: 'FINA',
    starred: false,
    color: 'blue',
    summary: '员工报销时上传大量照片/图片，现阶段依靠人工逐张审核，效率低、规则难以统一。引入 AI 对... 片进行自动分类，并按不同单据类型的规则进行合规性审核，辅助',
    filesCount: 8,
    rootFolder: {
      id: 'root-fina',
      name: 'FINA-20260410-001',
      type: 'folder',
      date: '10/04/26',
      children: [
        {
          id: 'fina-01',
          name: '01-需求文档',
          type: 'folder',
          date: '10/04/26',
          children: [
            {
              id: 'fina-file-1',
              name: 'AI智能报销审核需求说明书.md',
              type: 'file',
              size: '45 KB',
              date: '10/04/26',
              content: '# AI智能报销审核需求说明书\n\n## 痛点分析\n- 报销凭证种类繁杂（增值税发票、出租车票、火车票、定额发票等），人工审核耗时长且易错。\n- 合规规则多，人工记忆和匹配成本极高。\n\n## 解决手段\n引入 OCR + LLM 的智能识别与比对机制，自动完成对发票关键信息的抽取以及与报销规则的匹配校验。'
            }
          ]
        },
        {
          id: 'fina-02',
          name: '02-架构设计',
          type: 'folder',
          date: '10/04/26',
          children: [
            {
              id: 'fina-file-2',
              name: '系统架构及流程图.md',
              type: 'file',
              size: '24 KB',
              date: '10/04/26',
              content: '# 系统架构设计\n\n前端采用 React + Tailwind 进行报销单据的可视化呈现与交互。后端基于 Python Fast API 进行图片预处理与 OCR 解析。对接核心大模型完成合规大纲的抽取与判定。'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'project-3',
    code: 'TPR-20260326-001',
    name: 'TPR-20260326-001',
    letter: 'T',
    type: 'TPR',
    starred: false,
    color: 'charcoal',
    summary: '1. 基于 R001-R003 的洞察与映射逻辑，为深西康、人力、经营管理中心、财经中心设计具体的“... 材征集函 (Solicitation Letter)”模板。[TPR-20260326-001]',
    filesCount: 12,
    rootFolder: {
      id: 'root-tpr1',
      name: 'TPR-20260326-001',
      type: 'folder',
      date: '26/03/26',
      children: [
        {
          id: 'tpr1-01',
          name: '01-征集函模板',
          type: 'folder',
          date: '26/03/26',
          children: [
            {
              id: 'tpr1-file-1',
              name: '深西康征集函草案.md',
              type: 'file',
              size: '18 KB',
              date: '26/03/26',
              content: '# 深西康征集函草案\n\n本模板面向深西康相关合作部门，用于征集特定项目所需的专业建言及协作计划。'
            },
            {
              id: 'tpr1-file-2',
              name: '财经中心征集函草案.md',
              type: 'file',
              size: '15 KB',
              date: '26/03/26',
              content: '# 财经中心征集函草案\n\n面向财经体系的专项预算及申报数据征集公函模板。'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'project-4',
    code: 'TPR-20260329-001',
    name: 'TPR-20260329-001',
    letter: 'T',
    type: 'TPR',
    starred: false,
    color: 'charcoal',
    summary: '对任意指定组织的BP体系进行AI驱动的价值评估与分数分解，最终得出每个承接人（个人）的BP贡... 分值，用于价值分配/奖金系数计算。[TPR-20260329-001]',
    filesCount: 5,
    rootFolder: {
      id: 'root-tpr2',
      name: 'TPR-20260329-001',
      type: 'folder',
      date: '29/03/26',
      children: [
        {
          id: 'tpr2-01',
          name: '01-评估模型',
          type: 'folder',
          date: '29/03/26',
          children: [
            {
              id: 'tpr2-file-1',
              name: 'BP价值评估权重分配表.md',
              type: 'file',
              size: '32 KB',
              date: '29/03/26',
              content: '# BP价值评估权重分配表\n\n本表定义了考核交付成果、流程合规和业务敏捷性三个维度的评分权重比例。'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'project-5',
    code: 'TPR-20260329-002',
    name: 'TPR-20260329-002',
    letter: 'T',
    type: 'TPR',
    starred: false,
    color: 'blue',
    summary: 'AI慧记（Huiji）是公司内部的会议智能助手平台，提供语音转写、会议记录查询、二次改写等能力... 当前已有基础 Skill（`ai-huiji` v1.10.0），支持：[TPR-',
    filesCount: 15,
    rootFolder: {
      id: 'root-tpr3',
      name: 'TPR-20260329-002',
      type: 'folder',
      date: '29/03/26',
      children: [
        {
          id: 'tpr3-01',
          name: '01-平台说明',
          type: 'folder',
          date: '29/03/26',
          children: [
            {
              id: 'tpr3-file-1',
              name: 'AI慧记平台能力介绍.md',
              type: 'file',
              size: '56 KB',
              date: '29/03/26',
              content: '# AI慧记平台能力介绍\n\nAI慧记是高精度的会议智能助手系统：\n- 支持多人混音场景下的精确角色分离(Diarization)。\n- 智能提取会议决议并一键分发任务。\n- 自动翻译与重写成标准会议纪要格式。'
            }
          ]
        }
      ]
    }
  }
];


