#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix testimonials section translations for Japanese and Spanish
V5.24.6 - Testimonials Translation Fix
"""

# Japanese translations (lines 1743-1781)
japanese_fixes = {
    "'userTestimonials': 'Welcome to Leave a Message'": "'userTestimonials': 'メッセージをお寄せください'",
    "'welcomeToLeaveMessage': 'Welcome to Leave a Message'": "'welcomeToLeaveMessage': 'メッセージをお寄せください'",
    "'leaveYourMessage': 'Leave Your Message'": "'leaveYourMessage': 'メッセージを残す'",
    "'submitMessage': 'Submit Message'": "'submitMessage': 'メッセージを送信'",
    "'yourName': 'Your Name'": "'yourName': 'お名前'",
    "'yourRole': 'Your Role'": "'yourRole': '役職'",
    "'yourMessage': 'Your Message'": "'yourMessage': 'メッセージ内容'",
    "'yourRating': 'Your Rating'": "'yourRating': '評価'",
    "'roleExample': 'e.g., Product Manager, Entrepreneur, Student, etc.'": "'roleExample': '例：プロダクトマネージャー、起業家、学生など'",
    "'testimonial1Name': 'Chen Liu'": "'testimonial1Name': '劉晨'",
    "'testimonial1Role': 'Product Manager'": "'testimonial1Role': 'プロダクトマネージャー'",
    "'testimonial1Text': 'Our team\\'s review efficiency increased 3x after using this platform. We discover new improvements every time.'": "'testimonial1Text': 'このプラットフォームを使用してから、チームのレビュー効率が3倍に向上しました。毎回新しい改善点を発見できます。'",
    "'testimonial2Name': 'Sarah Chen'": "'testimonial2Name': 'サラ・チェン'",
    "'testimonial2Role': 'Entrepreneur'": "'testimonial2Role': '起業家'",
    "'testimonial2Text': 'Excellent tool! Helps me systematically record lessons learned during startup journey and avoid repeating mistakes.'": "'testimonial2Text': '素晴らしいツールです！起業の過程で得た教訓を体系的に記録し、同じ間違いを繰り返さないようにしてくれます。'",
    "'testimonial3Name': 'Hao Chen'": "'testimonial3Name': '陳浩'",
    "'testimonial3Role': 'Team Lead'": "'testimonial3Role': 'チームリーダー'",
    "'testimonial3Text': 'Team collaboration features are very practical. Everyone can participate in reviews and form collective wisdom.'": "'testimonial3Text': 'チームコラボレーション機能は非常に実用的です。全員がレビューに参加し、集合知を形成できます。'",
    "'addTestimonial': 'Add Testimonial'": "'addTestimonial': 'メッセージを追加'",
    "'editTestimonial': 'Edit Testimonial'": "'editTestimonial': 'メッセージを編集'",
    "'testimonialCreated': 'Testimonial created successfully'": "'testimonialCreated': 'メッセージが正常に作成されました'",
    "'messageWillBeReviewed': 'Your message will be reviewed by administrators before being published.'": "'messageWillBeReviewed': 'あなたのメッセージは公開前に管理者によって確認されます。'",
    "'messageSubmitted': 'Message submitted successfully! Thank you for your feedback.'": "'messageSubmitted': 'メッセージが正常に送信されました！フィードバックありがとうございます。'",
    "'pleaseComplete': 'Please complete all required fields'": "'pleaseComplete': '必須項目をすべて入力してください'",
    "'postedOn': 'Posted on'": "'postedOn': '投稿日'",
    "'justNow': 'Just now'": "'justNow': 'たった今'",
    "'minutesAgo': 'minutes ago'": "'minutesAgo': '分前'",
    "'hoursAgo': 'hours ago'": "'hoursAgo': '時間前'",
    "'daysAgo': 'days ago'": "'daysAgo': '日前'",
    "'testimonialUpdated': 'Testimonial updated successfully'": "'testimonialUpdated': 'メッセージが正常に更新されました'",
    "'testimonialDeleted': 'Testimonial deleted successfully'": "'testimonialDeleted': 'メッセージが正常に削除されました'",
    "'featured': 'Featured'": "'featured': '注目'",
    "'displayOrder': 'Display Order'": "'displayOrder': '表示順序'",
    "'rating': 'Rating'": "'rating': '評価'",
}

# Spanish translations (lines 2388-2425)
spanish_fixes = {
    "'userTestimonials': 'Welcome to Leave a Message'": "'userTestimonials': 'Bienvenido a Dejar un Mensaje'",
    "'welcomeToLeaveMessage': 'Welcome to Leave a Message'": "'welcomeToLeaveMessage': 'Bienvenido a Dejar un Mensaje'",
    "'leaveYourMessage': 'Leave Your Message'": "'leaveYourMessage': 'Deja tu Mensaje'",
    "'submitMessage': 'Submit Message'": "'submitMessage': 'Enviar Mensaje'",
    "'yourName': 'Your Name'": "'yourName': 'Tu Nombre'",
    "'yourRole': 'Your Role'": "'yourRole': 'Tu Rol'",
    "'yourMessage': 'Your Message'": "'yourMessage': 'Tu Mensaje'",
    "'yourRating': 'Your Rating'": "'yourRating': 'Tu Calificación'",
    "'roleExample': 'e.g., Product Manager, Entrepreneur, Student, etc.'": "'roleExample': 'p. ej., Gerente de Producto, Emprendedor, Estudiante, etc.'",
    "'testimonial1Name': 'Chen Liu'": "'testimonial1Name': 'Chen Liu'",
    "'testimonial1Role': 'Product Manager'": "'testimonial1Role': 'Gerente de Producto'",
    "'testimonial1Text': 'Our team\\'s review efficiency increased 3x after using this platform. We discover new improvements every time.'": "'testimonial1Text': 'La eficiencia de revisión de nuestro equipo aumentó 3 veces después de usar esta plataforma. Descubrimos nuevas mejoras cada vez.'",
    "'testimonial2Name': 'Sarah Chen'": "'testimonial2Name': 'Sarah Chen'",
    "'testimonial2Role': 'Entrepreneur'": "'testimonial2Role': 'Emprendedora'",
    "'testimonial2Text': 'Excellent tool! Helps me systematically record lessons learned during startup journey and avoid repeating mistakes.'": "'testimonial2Text': '¡Herramienta excelente! Me ayuda a registrar sistemáticamente las lecciones aprendidas durante el viaje de startup y evitar repetir errores.'",
    "'testimonial3Name': 'Hao Chen'": "'testimonial3Name': 'Hao Chen'",
    "'testimonial3Role': 'Team Lead'": "'testimonial3Role': 'Líder de Equipo'",
    "'testimonial3Text': 'Team collaboration features are very practical. Everyone can participate in reviews and form collective wisdom.'": "'testimonial3Text': 'Las funciones de colaboración en equipo son muy prácticas. Todos pueden participar en revisiones y formar sabiduría colectiva.'",
    "'addTestimonial': 'Add Testimonial'": "'addTestimonial': 'Agregar Testimonio'",
    "'editTestimonial': 'Edit Testimonial'": "'editTestimonial': 'Editar Testimonio'",
    "'testimonialCreated': 'Testimonial created successfully'": "'testimonialCreated': 'Testimonio creado exitosamente'",
    "'messageWillBeReviewed': 'Your message will be reviewed by administrators before being published.'": "'messageWillBeReviewed': 'Tu mensaje será revisado por los administradores antes de ser publicado.'",
    "'messageSubmitted': 'Message submitted successfully! Thank you for your feedback.'": "'messageSubmitted': '¡Mensaje enviado exitosamente! Gracias por tu comentario.'",
    "'pleaseComplete': 'Please complete all required fields'": "'pleaseComplete': 'Por favor complete todos los campos requeridos'",
    "'postedOn': 'Posted on'": "'postedOn': 'Publicado el'",
    "'justNow': 'Just now'": "'justNow': 'Justo ahora'",
    "'minutesAgo': 'minutes ago'": "'minutesAgo': 'minutos atrás'",
    "'hoursAgo': 'hours ago'": "'hoursAgo': 'horas atrás'",
    "'daysAgo': 'days ago'": "'daysAgo': 'días atrás'",
    "'testimonialUpdated': 'Testimonial updated successfully'": "'testimonialUpdated': 'Testimonio actualizado exitosamente'",
    "'testimonialDeleted': 'Testimonial deleted successfully'": "'testimonialDeleted': 'Testimonio eliminado exitosamente'",
    "'featured': 'Featured'": "'featured': 'Destacado'",
    "'displayOrder': 'Display Order'": "'displayOrder': 'Orden de Visualización'",
    "'rating': 'Rating'": "'rating': 'Calificación'",
}

def main():
    file_path = '/home/user/webapp/public/static/i18n.js'
    
    # Read file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Apply Japanese fixes
    print("Applying Japanese fixes...")
    for old, new in japanese_fixes.items():
        if old in content:
            content = content.replace(old, new)
            print(f"  ✓ Fixed: {old[:50]}...")
        else:
            print(f"  ⚠ Not found: {old[:50]}...")
    
    # Apply Spanish fixes
    print("\nApplying Spanish fixes...")
    for old, new in spanish_fixes.items():
        if old in content:
            content = content.replace(old, new)
            print(f"  ✓ Fixed: {old[:50]}...")
        else:
            print(f"  ⚠ Not found: {old[:50]}...")
    
    # Write back
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✅ Successfully updated {file_path}")
        print(f"📊 Japanese fixes: {len(japanese_fixes)} keys")
        print(f"📊 Spanish fixes: {len(spanish_fixes)} keys")
        print(f"📊 Total fixes: {len(japanese_fixes) + len(spanish_fixes)} keys")
    else:
        print("\n⚠ No changes made")

if __name__ == '__main__':
    main()
