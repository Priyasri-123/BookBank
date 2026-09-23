package com.bookbank.service.impl;

import com.bookbank.dto.request.BookRequest;
import com.bookbank.dto.response.BookResponse;
import com.bookbank.entity.Author;
import com.bookbank.entity.Book;
import com.bookbank.entity.BookCopy;
import com.bookbank.entity.Category;
import com.bookbank.entity.Publisher;
import com.bookbank.exception.InvalidRequestException;
import com.bookbank.exception.ResourceNotFoundException;
import com.bookbank.mapper.BookMapper;
import com.bookbank.repository.AuthorRepository;
import com.bookbank.repository.BookCopyRepository;
import com.bookbank.repository.BookRepository;
import com.bookbank.repository.CategoryRepository;
import com.bookbank.repository.PublisherRepository;
import com.bookbank.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final CategoryRepository categoryRepository;
    private final BookMapper bookMapper;
    private final BookCopyRepository bookCopyRepository;

    @Override
    @Transactional
    public BookResponse create(BookRequest request) {
        if (bookRepository.existsByIsbn(request.getIsbn())) {
            throw new InvalidRequestException("A book with ISBN " + request.getIsbn() + " already exists");
        }

        Author author = authorRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new ResourceNotFoundException("Author not found with id: " + request.getAuthorId()));
        Publisher publisher = publisherRepository.findById(request.getPublisherId())
                .orElseThrow(() -> new ResourceNotFoundException("Publisher not found with id: " + request.getPublisherId()));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Book book = Book.builder()
                .isbn(request.getIsbn())
                .title(request.getTitle())
                .description(request.getDescription())
                .author(author)
                .publisher(publisher)
                .category(category)
                .language(request.getLanguage())
                .edition(request.getEdition())
                .publicationYear(request.getPublicationYear())
                .totalCopies(request.getTotalCopies())
                .availableCopies(request.getTotalCopies()) // copies get created separately via BookCopy API
                .imageUrl(request.getImageUrl())
                .isDeleted(false)
                .build();

        return bookMapper.toResponse(bookRepository.save(book));
    }

    @Override
    @Transactional
    public BookResponse update(Long id, BookRequest request) {
        Book book = getActiveBookOrThrow(id);

        Author author = authorRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new ResourceNotFoundException("Author not found with id: " + request.getAuthorId()));
        Publisher publisher = publisherRepository.findById(request.getPublisherId())
                .orElseThrow(() -> new ResourceNotFoundException("Publisher not found with id: " + request.getPublisherId()));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        book.setIsbn(request.getIsbn());
        book.setTitle(request.getTitle());
        book.setDescription(request.getDescription());
        book.setAuthor(author);
        book.setPublisher(publisher);
        book.setCategory(category);
        book.setLanguage(request.getLanguage());
        book.setEdition(request.getEdition());
        book.setPublicationYear(request.getPublicationYear());
        book.setImageUrl(request.getImageUrl());
        // Note: totalCopies/availableCopies are managed via BookCopy operations, not edited directly here.

        return bookMapper.toResponse(bookRepository.save(book));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Book book = getActiveBookOrThrow(id);
        book.setIsDeleted(true); // soft delete: keeps borrowing history intact
        bookRepository.save(book);
    }

    @Override
    public BookResponse getById(Long id) {
        return enrich(getActiveBookOrThrow(id));
    }

    @Override
    public Page<BookResponse> search(String keyword, Pageable pageable) {
        return bookRepository.search(keyword, pageable).map(this::enrich);
    }

    @Override
    public Page<BookResponse> getAll(Pageable pageable) {
        return bookRepository.findByIsDeletedFalse(pageable).map(this::enrich);
    }

    private BookResponse enrich(Book b) {
        BookResponse r = bookMapper.toResponse(b);
        return bookMapper.toResponse(
                b,
                (int) bookCopyRepository.countByBookIdAndStatus(b.getId(), BookCopy.CopyStatus.ISSUED),
                (int) bookCopyRepository.countByBookIdAndStatus(b.getId(), BookCopy.CopyStatus.DAMAGED),
                (int) bookCopyRepository.countByBookIdAndStatus(b.getId(), BookCopy.CopyStatus.LOST),
                deriveBookStatus(r)
        );
    }

    private String deriveBookStatus(BookResponse r) {
        if (r.getAvailableCopies() != null && r.getAvailableCopies() > 0) return "AVAILABLE";
        if (r.getTotalCopies() != null && r.getTotalCopies() > 0) return "OUT_OF_STOCK";
        return "AVAILABLE";
    }

    private Book getActiveBookOrThrow(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
        if (Boolean.TRUE.equals(book.getIsDeleted())) {
            throw new ResourceNotFoundException("Book not found with id: " + id);
        }
        return book;
    }
}
