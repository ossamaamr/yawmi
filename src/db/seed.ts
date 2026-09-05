import { getDatabase } from './client';
import { categories, tasks } from './schema';

export async function seedDatabase(): Promise<void> {
  const db = await getDatabase();

  const existing = await db.select().from(categories).all();
  if (existing.length > 0) return;

  const now = Date.now();
  const MS_DAY = 86400000;

  const defaultCategories = [
    { id: 'cat_personal', name: 'شخصي', color: '#6366F1', icon: null, sortOrder: 0, createdAt: now },
    { id: 'cat_work', name: 'عمل', color: '#3B82F6', icon: null, sortOrder: 1, createdAt: now },
    { id: 'cat_health', name: 'صحة', color: '#10B981', icon: null, sortOrder: 2, createdAt: now },
    { id: 'cat_education', name: 'تعليم', color: '#8B5CF6', icon: null, sortOrder: 3, createdAt: now },
    { id: 'cat_shopping', name: 'تسوق', color: '#F59E0B', icon: null, sortOrder: 4, createdAt: now },
    { id: 'cat_home', name: 'منزل', color: '#EC4899', icon: null, sortOrder: 5, createdAt: now },
    { id: 'cat_finance', name: 'أموال', color: '#14B8A6', icon: null, sortOrder: 6, createdAt: now },
    { id: 'cat_social', name: 'اجتماعي', color: '#F97316', icon: null, sortOrder: 7, createdAt: now },
    { id: 'cat_other', name: 'أخرى', color: '#6B7280', icon: null, sortOrder: 8, createdAt: now },
  ];

  for (const cat of defaultCategories) {
    await db.insert(categories).values(cat);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = todayStart.getTime();

  const sampleTasks = [
    {
      id: 'task_sample_1',
      title: 'مراجعة الفصل الأول',
      description: 'مراجعة شاملة للفصل الأول في مادة الرياضيات',
      categoryId: 'cat_education',
      priority: 2,
      status: 'active',
      dueDate: today,
      dueTime: '19:00',
      isRecurring: 0, isProgressive: 0, isRoutine: 0,
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task_sample_2',
      title: 'تمارين رياضية',
      description: '30 دقيقة تمارين خفيفة',
      categoryId: 'cat_health',
      priority: 1,
      status: 'active',
      dueDate: today,
      dueTime: '07:00',
      isRecurring: 1, isProgressive: 0, isRoutine: 0,
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task_sample_3',
      title: 'شراء احتياجات المنزل',
      description: 'حليب، خبز، فواكه وخضروات',
      categoryId: 'cat_shopping',
      priority: 0,
      status: 'active',
      dueDate: today + MS_DAY,
      dueTime: null,
      isRecurring: 0, isProgressive: 0, isRoutine: 0,
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task_sample_4',
      title: 'تبليغ التقرير الشهري',
      description: 'إنهاء وتقرير العمل لهذا الشهر',
      categoryId: 'cat_work',
      priority: 2,
      status: 'active',
      dueDate: today - MS_DAY,
      dueTime: '17:00',
      isRecurring: 0, isProgressive: 0, isRoutine: 0,
      createdAt: now, updatedAt: now,
    },
    {
      id: 'task_sample_5',
      title: 'مكالمة مع العائلة',
      description: null,
      categoryId: 'cat_social',
      priority: 1,
      status: 'active',
      dueDate: today + MS_DAY * 2,
      dueTime: '20:00',
      isRecurring: 0, isProgressive: 0, isRoutine: 0,
      createdAt: now, updatedAt: now,
    },
  ];

  for (const task of sampleTasks) {
    await db.insert(tasks).values(task);
  }
}
