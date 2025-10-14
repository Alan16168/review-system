-- Add English columns to templates table
ALTER TABLE templates ADD COLUMN name_en TEXT;
ALTER TABLE templates ADD COLUMN description_en TEXT;

-- Add English column to template_questions table
ALTER TABLE template_questions ADD COLUMN question_text_en TEXT;

-- Update existing templates with English translations
-- Template 1: 灵魂9问
UPDATE templates 
SET name_en = 'Nine Key Questions',
    description_en = 'This is the default system template, suitable for any review work'
WHERE id = 1;

-- Template 2: 个人年复盘
UPDATE templates 
SET name_en = 'Personal Yearly Review',
    description_en = 'This template is designed to help you review the past year and plan for the upcoming year. It contains guiding questions and exercises to help you identify patterns, celebrate achievements, and set goals. This workbook is divided into two parts: one focusing on reviewing the past year and another focusing on planning the future. This requires several hours of focused time and an open mindset. You can also do it in groups, but participants should respect each other''s privacy and only share what they feel comfortable with. Prepare your tools and environment. Close your eyes and take three deep breaths. Let go of your expectations.'
WHERE id = 2;

-- Update template questions with English translations
-- Template 1: 灵魂9问 (Nine Key Questions)
UPDATE template_questions SET question_text_en = 'What was my goal?' WHERE template_id = 1 AND question_number = 1;
UPDATE template_questions SET question_text_en = 'Was the goal achieved?' WHERE template_id = 1 AND question_number = 2;
UPDATE template_questions SET question_text_en = 'What went well?' WHERE template_id = 1 AND question_number = 3;
UPDATE template_questions SET question_text_en = 'Can the success be replicated?' WHERE template_id = 1 AND question_number = 4;
UPDATE template_questions SET question_text_en = 'What went wrong?' WHERE template_id = 1 AND question_number = 5;
UPDATE template_questions SET question_text_en = 'What caused the problems?' WHERE template_id = 1 AND question_number = 6;
UPDATE template_questions SET question_text_en = 'How to avoid and optimize next time?' WHERE template_id = 1 AND question_number = 7;
UPDATE template_questions SET question_text_en = 'What underlying principles did I learn?' WHERE template_id = 1 AND question_number = 8;
UPDATE template_questions SET question_text_en = 'If I could do it again, what would I do?' WHERE template_id = 1 AND question_number = 9;
UPDATE template_questions SET question_text_en = 'Any other items that need review?' WHERE template_id = 1 AND question_number = 10;

-- Template 2: 个人年复盘 (Personal Yearly Review) - 53 questions
UPDATE template_questions SET question_text_en = 'Browse through last year''s calendar week by week. If you see important events, family gatherings, friend gatherings, or important projects, write them down here. Know that these are my insights from last year. Our lives experience vastly different yet interconnected aspects. Consider the following aspects and ask yourself what important events occurred in each. Write down your answers. The first category is personal life (write everything related to family here)' WHERE template_id = 2 AND question_number = 1;
UPDATE template_questions SET question_text_en = 'The second category is about career and academics, write here:' WHERE template_id = 2 AND question_number = 2;
UPDATE template_questions SET question_text_en = 'The third category is about friends and community, write here:' WHERE template_id = 2 AND question_number = 3;
UPDATE template_questions SET question_text_en = 'The fourth category is about relaxation, hobbies, and creativity, write here:' WHERE template_id = 2 AND question_number = 4;
UPDATE template_questions SET question_text_en = 'The fifth category is about physical health and fitness, write here:' WHERE template_id = 2 AND question_number = 5;
UPDATE template_questions SET question_text_en = 'The sixth category is about mental health and self-awareness, write here:' WHERE template_id = 2 AND question_number = 6;
UPDATE template_questions SET question_text_en = 'The seventh category is about habits that lead to a better tomorrow, write here:' WHERE template_id = 2 AND question_number = 7;
UPDATE template_questions SET question_text_en = 'What did I do this year to make the world a better place than when I found it?' WHERE template_id = 2 AND question_number = 8;
UPDATE template_questions SET question_text_en = 'Summarize my past year in six sentences. What was the wisest decision I made?' WHERE template_id = 2 AND question_number = 9;
UPDATE template_questions SET question_text_en = 'What was the most important lesson I learned?' WHERE template_id = 2 AND question_number = 10;
UPDATE template_questions SET question_text_en = 'What was the biggest risk I took?' WHERE template_id = 2 AND question_number = 11;
UPDATE template_questions SET question_text_en = 'What was the biggest surprise this year?' WHERE template_id = 2 AND question_number = 12;
UPDATE template_questions SET question_text_en = 'What was the most important thing I did for others?' WHERE template_id = 2 AND question_number = 13;
UPDATE template_questions SET question_text_en = 'What was the biggest accomplishment I completed?' WHERE template_id = 2 AND question_number = 14;
UPDATE template_questions SET question_text_en = 'Describe the most beautiful, unforgettable, and happiest moments of last year. Draw them on this paper. How did you feel? Who was with you? What were you doing? What smells, sounds, or tastes do you remember?' WHERE template_id = 2 AND question_number = 15;
UPDATE template_questions SET question_text_en = 'List my three biggest achievements from last year here.' WHERE template_id = 2 AND question_number = 16;
UPDATE template_questions SET question_text_en = 'How did I achieve these accomplishments?' WHERE template_id = 2 AND question_number = 17;
UPDATE template_questions SET question_text_en = 'Who helped me achieve these successes? How did they do it?' WHERE template_id = 2 AND question_number = 18;
UPDATE template_questions SET question_text_en = 'List my three biggest challenges from last year here.' WHERE template_id = 2 AND question_number = 19;
UPDATE template_questions SET question_text_en = 'Who or what helped me overcome these challenges?' WHERE template_id = 2 AND question_number = 20;
UPDATE template_questions SET question_text_en = 'What new insights did I gain about myself while overcoming these challenges?' WHERE template_id = 2 AND question_number = 21;
UPDATE template_questions SET question_text_en = 'Forgiveness. In the past year, is there anything that still needs forgiveness? What actions or words made you sad? Or am I angry with myself? Write them down. Be kind to yourself and forgive others.' WHERE template_id = 2 AND question_number = 22;
UPDATE template_questions SET question_text_en = 'If you''re not ready to forgive yet, please write that down too. This will bring unexpected surprises.' WHERE template_id = 2 AND question_number = 23;
UPDATE template_questions SET question_text_en = 'Letting go. Is there anything else I want to say? Before starting the new year, is there something you must let go of? Draw it or write it down, then reflect and let it all go.' WHERE template_id = 2 AND question_number = 24;
UPDATE template_questions SET question_text_en = 'Summarize the past year in three words (choose three words to define your past year).' WHERE template_id = 2 AND question_number = 25;
UPDATE template_questions SET question_text_en = 'If my past year were a book, a book about your past, or a movie, what would I title it?' WHERE template_id = 2 AND question_number = 26;
UPDATE template_questions SET question_text_en = 'Say goodbye to your old year. If there''s anything else I want to write down or say goodbye to anyone, write it now.' WHERE template_id = 2 AND question_number = 27;
UPDATE template_questions SET question_text_en = 'Dare to pursue my dreams. What will my upcoming year look like? What would ideally happen? Why would it be great? Write it down, draw it, let go of your concerns, and dream bravely.' WHERE template_id = 2 AND question_number = 28;
UPDATE template_questions SET question_text_en = 'These are my goals for next year. Review various aspects of your life and determine goals for each aspect next year. Write these goals down—this is the first step to achieving them. Part one about personal life and family:' WHERE template_id = 2 AND question_number = 29;
UPDATE template_questions SET question_text_en = 'The second category is about career and academics, write here:' WHERE template_id = 2 AND question_number = 30;
UPDATE template_questions SET question_text_en = 'The third category is about friends and community, write here:' WHERE template_id = 2 AND question_number = 31;
UPDATE template_questions SET question_text_en = 'The fourth category is about relaxation, hobbies, and creativity, write here:' WHERE template_id = 2 AND question_number = 32;
UPDATE template_questions SET question_text_en = 'The fifth category is about physical health and fitness, write here:' WHERE template_id = 2 AND question_number = 33;
UPDATE template_questions SET question_text_en = 'The sixth category is about mental health and self-awareness, write here:' WHERE template_id = 2 AND question_number = 34;
UPDATE template_questions SET question_text_en = 'The seventh category is about habits that define your better tomorrow, write here:' WHERE template_id = 2 AND question_number = 35;
UPDATE template_questions SET question_text_en = 'Three things I will love about myself.' WHERE template_id = 2 AND question_number = 36;
UPDATE template_questions SET question_text_en = 'Three things I am ready to let go of.' WHERE template_id = 2 AND question_number = 37;
UPDATE template_questions SET question_text_en = 'Three things I most want to achieve.' WHERE template_id = 2 AND question_number = 38;
UPDATE template_questions SET question_text_en = 'These three people will be my pillars during difficult times.' WHERE template_id = 2 AND question_number = 39;
UPDATE template_questions SET question_text_en = 'Three things I will be brave enough to explore.' WHERE template_id = 2 AND question_number = 40;
UPDATE template_questions SET question_text_en = 'I will have the power to refuse these three things.' WHERE template_id = 2 AND question_number = 41;
UPDATE template_questions SET question_text_en = 'I will use these three things to make my surroundings comfortable.' WHERE template_id = 2 AND question_number = 42;
UPDATE template_questions SET question_text_en = 'I will do these three things every morning.' WHERE template_id = 2 AND question_number = 43;
UPDATE template_questions SET question_text_en = 'I will regularly reward myself with these three things.' WHERE template_id = 2 AND question_number = 44;
UPDATE template_questions SET question_text_en = 'I will go to these three places.' WHERE template_id = 2 AND question_number = 45;
UPDATE template_questions SET question_text_en = 'I will connect with people I love in these three ways.' WHERE template_id = 2 AND question_number = 46;
UPDATE template_questions SET question_text_en = 'I will reward my success with these three gifts.' WHERE template_id = 2 AND question_number = 47;
UPDATE template_questions SET question_text_en = 'This year I will stop procrastinating on these things:' WHERE template_id = 2 AND question_number = 48;
UPDATE template_questions SET question_text_en = 'This year I will draw the most energy from the following places:' WHERE template_id = 2 AND question_number = 49;
UPDATE template_questions SET question_text_en = 'This year I will be most brave when the following events occur:' WHERE template_id = 2 AND question_number = 50;
UPDATE template_questions SET question_text_en = 'This year is special to me for the following reasons:' WHERE template_id = 2 AND question_number = 51;
UPDATE template_questions SET question_text_en = 'My blessing for the coming year. Choose a word to symbolize and define the coming year. If you need extra energy, look at this word, and you will remember not to give up on your dreams.' WHERE template_id = 2 AND question_number = 52;
UPDATE template_questions SET question_text_en = 'Do you have any secret wishes? Free your mind and write them down.' WHERE template_id = 2 AND question_number = 53;
