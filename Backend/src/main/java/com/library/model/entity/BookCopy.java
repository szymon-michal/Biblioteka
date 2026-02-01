package com.library.model.entity;

import com.library.model.enums.BookCopyStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "book_copy")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookCopy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", insertable = false, updatable = false)
    private Book book;

    @Column(name = "inventory_code", unique = true, nullable = false)
    private String inventoryCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookCopyStatus status = BookCopyStatus.AVAILABLE;

    @Column(name = "shelf_location")
    private String shelfLocation;

    @CreatedDate
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean isAvailable() {
        return status == BookCopyStatus.AVAILABLE;
    }


    public void setAvailable(boolean available) {
        if (available) {
            this.status = BookCopyStatus.AVAILABLE;
        } else {
            // tylko jeśli aktualnie była dostępna
            if (this.status == BookCopyStatus.AVAILABLE) {
                this.status = BookCopyStatus.BORROWED;
            }
        }
    }
}