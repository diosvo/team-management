import { uiTranslations } from 'fumadocs-ui/i18n';

import { i18n } from './i18n';

/**
 * Fumadocs UI strings per language. Keys come from `fumadocs-ui/i18n`;
 * English is the built-in default, so only `displayName` is set for it.
 */
export const translations = i18n
  .translations()
  .extend(uiTranslations())
  .add({
    en: {
      displayName: 'English',
    },
    vi: {
      displayName: 'Tiếng Việt',
      'Ask AI(AI chat button)': 'Hỏi AI',
      'Back to Home(404 not found page)': 'Về trang chủ',
      'Choose a language(language switcher)': 'Chọn ngôn ngữ',
      'Choose a language(language switcher)(aria-label)': 'Chọn ngôn ngữ',
      'Close Banner(banner)(aria-label)': 'Đóng thông báo',
      'Close Search(search dialog)(aria-label)': 'Đóng tìm kiếm',
      'Close Sidebar(aria-label)': 'Đóng thanh bên',
      'Close Sidebar(sidebar)(aria-label)': 'Đóng thanh bên',
      'Collapse Sidebar(sidebar)(aria-label)': 'Thu gọn thanh bên',
      'Copied Text(code block)(aria-label)': 'Đã sao chép',
      'Copy Anchor Link(heading anchor)(aria-label)': 'Sao chép liên kết',
      'Copy Link(accordion)(aria-label)': 'Sao chép liên kết',
      'Copy Markdown(page actions)': 'Sao chép Markdown',
      'Copy Text(code block)(aria-label)': 'Sao chép',
      'Dark(theme switcher)(aria-label)': 'Tối',
      'Default(type table)': 'Mặc định',
      'Edit on GitHub(edit page)': 'Sửa trên GitHub',
      'Hide Sidebar(sidebar)': 'Ẩn thanh bên',
      'Last updated on(page footer)': 'Cập nhật lần cuối',
      'Layout Tab(layout tab trigger)': 'Tab bố cục',
      'Light(theme switcher)(aria-label)': 'Sáng',
      'Next Page(pagination)': 'Trang tiếp',
      'No Headings(table of contents)': 'Không có tiêu đề',
      'No results found(search dialog)': 'Không tìm thấy kết quả',
      'On this page(table of contents)': 'Trong trang này',
      'Open Search(search trigger)(aria-label)': 'Mở tìm kiếm',
      'Open Sidebar(aria-label)': 'Mở thanh bên',
      'Open Sidebar(sidebar)(aria-label)': 'Mở thanh bên',
      'Open in ChatGPT(page actions)': 'Mở trong ChatGPT',
      'Open in Claude(page actions)': 'Mở trong Claude',
      'Open in Cursor(page actions)': 'Mở trong Cursor',
      'Open in GitHub(page actions)': 'Mở trên GitHub',
      'Open in Scira AI(page actions)': 'Mở trong Scira AI',
      'Open(page actions)': 'Mở',
      'Page Not Found(404 not found page)': 'Không tìm thấy trang',
      'Parameters(type table)': 'Tham số',
      'Previous Page(pagination)': 'Trang trước',
      'Prop(type table)': 'Thuộc tính',
      'Read {url}, I want to ask questions about it.(page actions)':
        'Đọc {url}, tôi muốn hỏi về nội dung này.',
      'Returns(type table)': 'Trả về',
      'Search(search dialog)': 'Tìm kiếm',
      'Search(search trigger)': 'Tìm kiếm',
      'Show Sidebar(sidebar)': 'Hiện thanh bên',
      'System(theme switcher)(aria-label)': 'Hệ thống',
      'Table of Contents(inline table of contents)': 'Mục lục',
      'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 not found page)':
        'Trang bạn tìm có thể đã bị xóa, đổi tên hoặc tạm thời không truy cập được.',
      'Toggle Menu(home layout header)(aria-label)': 'Bật/tắt menu',
      'Toggle Theme(theme switcher)(aria-label)': 'Đổi giao diện',
      'Type(type table)': 'Kiểu',
      'View as Markdown(page actions)': 'Xem dạng Markdown',
    },
  });
