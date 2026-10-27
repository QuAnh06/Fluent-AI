import { DailyChallenge } from '../types';

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'challenge_day_1',
    dateStr: new Date().toISOString().split('T')[0],
    title: 'Thử Thách: Kể Về Bước Ngoặt Đáng Nhớ',
    prompt: 'Describe a significant turning point in your life that changed the way you think.',
    missionVi: 'Nói liên tục từ 45 - 90 giây. Thể hiện rõ việc kết hợp giữa quá khứ và hiện tại.',
    ruleConstraintVi: '🎯 Mục tiêu: Dùng ít nhất 2 câu phức (Although / Whereas / Since) và không lạm dụng "um/uh".',
    completed: false,
  },
  {
    id: 'challenge_day_2',
    dateStr: '2026-10-28',
    title: 'Thử Thách: Thuyết Trình Về Thói Quen Nhỏ',
    prompt: 'What is one tiny habit you practice daily that brings enormous benefits?',
    missionVi: 'Trình bày súc tích trong 60 giây theo cấu trúc: Thói quen là gì -> Lý do bắt đầu -> Tác động.',
    ruleConstraintVi: '🎯 Mục tiêu: Sử dụng ít nhất 3 collocations nâng cao về năng suất (productivity / consistency).',
    completed: false,
  },
  {
    id: 'challenge_day_3',
    dateStr: '2026-10-29',
    title: 'Thử Thách: Đưa Ra Ý Kiến Về Trí Tuệ Nhân Tạo',
    prompt: 'Do you think smartphones are making people more connected or more isolated?',
    missionVi: 'Nêu quan điểm hai chiều (two-sided argument) trong 60 - 90 giây.',
    ruleConstraintVi: '🎯 Mục tiêu: Sử dụng các cụm nối tương phản như "On the flip side", "Notwithstanding the benefits".',
    completed: false,
  },
];
