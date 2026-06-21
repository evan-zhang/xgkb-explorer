#!/usr/bin/env python3
"""修复 prototype-v2.html 的三个问题"""

def fix_render_shelf(content):
    """修复 renderShelf 函数的条件检查"""
    old_code = """    if (tprCardsContainer) {
      // Clear existing content
      tprCardsContainer.innerHTML = '';
      bizCardsContainer.innerHTML = '';
      tprRowsContainer.innerHTML = '';
      bizRowsContainer.innerHTML = '';

      // Add projects
      TPR_PROJECTS.forEach(p => tprCardsContainer.appendChild(createBookCard(p)));
      BIZ_PROJECTS.forEach(p => bizCardsContainer.appendChild(createBookCard(p)));
      TPR_PROJECTS.forEach(p => tprRowsContainer.appendChild(createListRow(p)));
      BIZ_PROJECTS.forEach(p => bizRowsContainer.appendChild(createListRow(p)));
    }"""

    new_code = """    console.log('renderShelf: TPR_PROJECTS=', TPR_PROJECTS.length, 'BIZ_PROJECTS=', BIZ_PROJECTS.length);

    if (tprCardsContainer && bizCardsContainer && tprRowsContainer && bizRowsContainer) {
      // Clear existing content
      tprCardsContainer.innerHTML = '';
      bizCardsContainer.innerHTML = '';
      tprRowsContainer.innerHTML = '';
      bizRowsContainer.innerHTML = '';

      // Add projects
      TPR_PROJECTS.forEach(p => tprCardsContainer.appendChild(createBookCard(p)));
      BIZ_PROJECTS.forEach(p => bizCardsContainer.appendChild(createBookCard(p)));
      TPR_PROJECTS.forEach(p => tprRowsContainer.appendChild(createListRow(p)));
      BIZ_PROJECTS.forEach(p => bizRowsContainer.appendChild(createListRow(p)));
    } else {
      console.error('renderShelf: 无法找到所有容器!', {
        tprCards: !!tprCardsContainer,
        bizCards: !!bizCardsContainer,
        tprRows: !!tprRowsContainer,
        bizRows: !!bizRowsContainer
      });
    }"""

    if old_code in content:
        return content.replace(old_code, new_code)
    else:
        print("警告：未找到需要替换的 renderShelf 代码")
        return content

def fix_mobile_styles(content):
    """修复移动端样式，防止文字竖排"""
    # 查找移动端响应式部分
    old_brand_style = """  @media (max-width: 768px) {
    .lib-topbar { padding: 0 12px; height: 52px; }
    .brand-name { font-size: 15px; }
    .brand-name .accent { display: none; }
    .brand-mark { width: 28px; height: 28px; font-size: 14px; }"""

    new_brand_style = """  @media (max-width: 768px) {
    .lib-topbar { padding: 0 12px; height: 52px; }
    .brand { flex-shrink: 0; min-width: max-content; }
    .brand-name { font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .brand-name .accent { display: none; }
    .brand-mark { width: 28px; height: 28px; font-size: 14px; flex-shrink: 0; }"""

    if old_brand_style in content:
        return content.replace(old_brand_style, new_brand_style)
    else:
        print("警告：未找到需要替换的移动端样式")
        return content

def fix_loading_overlay(content):
    """确保加载完成后隐藏 loading overlay"""
    # 查找 loadingOverlay.classList.add('hidden') 的位置
    old_code = """      TPR_PROJECTS = tprProjects;
      BIZ_PROJECTS = bizProjects;

      renderShelf();

    } catch (error) {"""

    new_code = """      TPR_PROJECTS = tprProjects;
      BIZ_PROJECTS = bizProjects;

      renderShelf();
      loadingOverlay.classList.add('hidden');

    } catch (error) {"""

    if old_code in content:
        return content.replace(old_code, new_code)
    else:
        print("警告：未找到需要替换的 loading 代码")
        return content

def main():
    with open('/Users/evan/xgkb-explorer/prototype-v2.html', 'r', encoding='utf-8') as f:
        content = f.read()

    print("开始修复...")
    content = fix_render_shelf(content)
    content = fix_mobile_styles(content)
    content = fix_loading_overlay(content)

    with open('/Users/evan/xgkb-explorer/prototype-v2.html', 'w', encoding='utf-8') as f:
        f.write(content)

    print("修复完成！")

if __name__ == '__main__':
    main()
