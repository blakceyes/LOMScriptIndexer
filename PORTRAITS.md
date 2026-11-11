# 对话头像与表情试验版

实现日期：2026-11-11。数据格式版本 27，解释器缓存版本 22。

## 运行

需要本机已安装的 Windows 版游戏、Python 3.14+、uv、Node.js 24+ 和 pnpm。

在仓库根目录执行：

~~~powershell
uv sync
uv run scriptindexer-extract --game 'D:\SteamLibrary\steamapps\common\LegendOfMortal' --langs zh-tw,zh-cn
uv run scriptindexer-build --langs zh-tw
Set-Location web
pnpm install --frozen-lockfile
pnpm build
Set-Location ..
uv run python -m http.server 8123 --bind 127.0.0.1 --directory docs
~~~

浏览器访问本地 8123 端口；剧情地址的 hash 为 #/act2_3_1 或 #/ch5_6_5_2_3。展开分支可看到赵活的 shock / nervous3 和郁竹的 shy。已有的 run.ps1（参数 -GameDir <游戏目录> -NoBrowser）也会执行提取与构建。

仅重新导出头像：

~~~powershell
uv run scriptindexer-portraits --game 'D:\SteamLibrary\steamapps\common\LegendOfMortal'
~~~

提取命令默认导出头像，可用 --no-portraits 跳过。首次导出需要扫描资源；后续按游戏配置、Addressables catalog、bundle 大小和修改时间复用缓存。图片删除后会重新导出，--force 可强制重建。

开发网页可在 web 目录运行 pnpm dev，Vite 会从 docs/data 提供剧情、JSON 清单和 WebP 图片。

## 显示规则

- 读取 setcharacter 的第二个参数、stage.showPortrait 和 stage.show{portrait=...}；加载素材不计为显示变化。
- 每个角色独立维护表情和变化序号。首次出现、表情改变、在其他人发言期间改变后又恢复时显示头像；相同状态的后续台词不重复。
- 过滤正文后计算实际可见行，隐藏台词不会消耗首次头像。变化序号可保留被隐藏的内心独白中发生的表情变化。
- 互斥分支复制状态，合流仅保留一致结果；没有 else 时包括未执行分支的路径。无法确定的状态明确标为未知。
- 独立展开的分支、选项和跳转片段各自显示首次头像；分支合流和场景切换后重建显示上下文。命名的内心独白支持头像，旁白不显示。
- 已知角色请求了未提供图片的表情时，使用配置中的 normal 图片并标注“默认头像”，提示中保留原表情。未知表情、角色无图、默认图也加载失败时显示占位图；不会把未知状态解释成 normal。

## 资源与数据

角色与表情映射来自游戏的 StoryCharacterConfig._list、StoryCharacterData._mapping 和 _portraitResourceList。继续解析 Addressables 的别名、实际资源地址和 bundle 依赖，按 bundle container 中的完整地址查找 Sprite。不同服装和不同角色不会按文件名前缀混配。同名配置冲突会记录为问题，并使用回退。

导出图片裁去透明边缘、保留立绘上部，最大 192 × 224，保存为内容哈希命名的 WebP；实际页面采用较小尺寸、懒加载和异步解码。内容相同的图片共用文件。

生成文件位于 docs/data/portraits/，manifest.json 保存角色 / 表情 / 图片映射、缓存指纹和导出问题。带表情的台词格式：

~~~json
["say", "player", "台词", "dialog", {"character":"player","expression":"shock","changed":true,"revision":1}]
~~~

原始游戏文件只读。Lua、剧情文本、生成的图片和站点数据继续由 .gitignore 排除，源码分支不包含游戏素材。重新构建网页会保留 docs/data/portraits。

## 验证与已知限制

本机 v1.0.6001.0 资源核验：

- 2,202 个脚本分析完成，无解析失败；77,001 条 say，其中 72,706 条有命名角色。
- 531 个角色标识，1,119 张去重图片。
- 65,800 条命名台词有精确表情图片（90.5%）；其余 6,906 条均有 normal 图片可明确回退。许多普通 NPC 本来仅提供 normal。
- 一处配置冲突：special405 / laugh2。保留诊断，不任意选择图片。
- 20 项 Python 回归测试、13 项前端逻辑测试；类型检查、lint 和生产构建通过。
- 已在真实浏览器检查两个样例的图片、分支展开，以及 390px 宽度下的布局；模拟图片 404，验证默认图片和占位图回退。截图保存在本机 output/playwright。

以上数量仅统计 Lua 对话；战斗卡片自己携带的对白尚未接入头像。解释器仍是静态分析，不执行 Lua：运行时动态逻辑、循环、外部函数和跨脚本状态仍受现有分析能力限制；不保证所有游玩路径与游戏运行时完全一致。

可重新运行验证：

~~~powershell
uv run python -m unittest discover -s tests -v
uv run python tools/audit_portraits.py
Set-Location web
pnpm test
pnpm typecheck
pnpm lint
pnpm build
~~~

覆盖率报告写入被忽略的 data/cache/portrait-coverage.json，列出请求了缺失表情的角色、表情和脚本。
