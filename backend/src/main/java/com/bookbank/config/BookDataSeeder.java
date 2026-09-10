package com.bookbank.config;

import com.bookbank.dto.request.BookCopyRequest;
import com.bookbank.entity.Author;
import com.bookbank.entity.Book;
import com.bookbank.entity.Category;
import com.bookbank.entity.Publisher;
import com.bookbank.repository.AuthorRepository;
import com.bookbank.repository.BookCopyRepository;
import com.bookbank.repository.BookRepository;
import com.bookbank.repository.CategoryRepository;
import com.bookbank.repository.PublisherRepository;
import com.bookbank.service.BookCopyService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BookDataSeeder implements CommandLineRunner {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final CategoryRepository categoryRepository;
    private final BookCopyRepository bookCopyRepository;
    private final BookCopyService bookCopyService;

    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private int copyCounter = 1;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            ensureBooksAreAvailable();
            ensureBookCopiesExist();
            seedMissingBooks();
        } catch (Exception e) {
        }
    }

    @Transactional
    public void ensureBooksAreAvailable() {
        List<Book> books = bookRepository.findAll();
        boolean changed = false;
        for (Book book : books) {
            if (book.getTotalCopies() == null || book.getTotalCopies() == 0) {
                book.setTotalCopies(3);
                book.setAvailableCopies(3);
                changed = true;
            }
        }
        if (changed) {
            bookRepository.saveAll(books);
        }
    }

    @Transactional
    public void ensureBookCopiesExist() {
        try {
            List<Book> books = bookRepository.findAll();
            for (Book book : books) {
                try {
                    long existingCopies = bookCopyRepository.countByBookAndStatus(book, com.bookbank.entity.BookCopy.CopyStatus.AVAILABLE);
                    if (existingCopies == 0) {
                        for (int i = 0; i < 3; i++) {
                            String copyCode = String.format("BK%03d", copyCounter++);
                            BookCopyRequest req = new BookCopyRequest();
                            req.setBookId(book.getId());
                            req.setCopyCode(copyCode);
                            req.setCondition("NEW");
                            req.setPurchaseDate(null);
                            bookCopyService.addCopy(req);
                        }
                    }
                } catch (Exception e) {
                }
            }
        } catch (Exception e) {
        }
    }

    @Transactional
    public void seedMissingBooks() {
        Map<String, List<String>> categoryQueries = Map.of(
                "Programming", List.of("java programming", "python programming", "c programming", "software engineering", "data structures", "algorithms", "oop"),
                "Database", List.of("sql", "mysql", "mongodb", "database design", "oracle database", "data warehouse", "nosql"),
                "Networking", List.of("computer networks", "tcp ip", "cybersecurity", "network security", "wireless communication", "cloud computing", "data communication"),
                "Artificial Intelligence", List.of("machine learning", "deep learning", "neural networks", "natural language processing", "computer vision", "robotics", "expert systems"),
                "Data Science", List.of("data analytics", "statistics", "data mining", "big data", "hadoop", "spark", "data visualization"),
                "Web Development", List.of("html css", "javascript", "react", "angular", "node.js", "php", "bootstrap"),
                "Electronics", List.of("digital electronics", "microcontroller", "arduino", "embedded systems", "circuit design", "vlsi", "microprocessor"),
                "Mathematics", List.of("discrete mathematics", "linear algebra", "calculus", "probability", "numerical methods", "mathematical logic", "graph theory"),
                "General", List.of("science fiction", "history", "biography", "physics", "chemistry", "philosophy", "economics")
        );

        Map<String, Category> categories = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getName, c -> c));

        Set<String> usedIds = new HashSet<>();
        List<Book> allBooks = bookRepository.findAll();
        for (Book b : allBooks) {
            if (b.getIsbn() != null) {
                usedIds.add(b.getIsbn());
            }
        }

        for (Map.Entry<String, List<String>> entry : categoryQueries.entrySet()) {
            String categoryName = entry.getKey();
            List<String> queries = entry.getValue();
            Category category = categories.get(categoryName);

            if (category == null) {
                continue;
            }

            long currentCount = allBooks.stream()
                    .filter(b -> b.getCategory() != null && categoryName.equals(b.getCategory().getName()))
                    .count();

            int addedForCategory = (int) currentCount;

            for (String query : queries) {
                if (addedForCategory >= 20) {
                    break;
                }

                try {
                    String url = "https://openlibrary.org/search.json?q=" + query.replace(" ", "+") + "&limit=50&fields=title,author_name,first_publish_year,publisher,isbn,subject,cover_i";
                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .timeout(java.time.Duration.ofSeconds(20))
                            .GET()
                            .build();

                    HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

                    if (response.statusCode() != 200) {
                        continue;
                    }

                    JsonNode root = OBJECT_MAPPER.readTree(response.body());
                    JsonNode docs = root.get("docs");

                    if (docs == null || !docs.isArray()) {
                        continue;
                    }

                    for (JsonNode doc : docs) {
                        if (addedForCategory >= 20) {
                            break;
                        }

                        String isbn = extractValidIsbn(doc);
                        if (isbn == null) {
                            continue;
                        }

                        if (!usedIds.add(isbn)) {
                            continue;
                        }

                        if (bookRepository.existsByIsbn(isbn)) {
                            usedIds.remove(isbn);
                            continue;
                        }

                        String title = getText(doc, "title");
                        if (title == null || title.isBlank()) {
                            usedIds.remove(isbn);
                            continue;
                        }

                        String authorName = getFirstArrayValue(doc, "author_name");
                        Author author = ensureAuthor(authorName);

                        String publisherName = getFirstArrayValue(doc, "publisher");
                        Publisher publisher = ensurePublisher(publisherName);

                        Integer year = null;
                        JsonNode yearNode = doc.get("first_publish_year");
                        if (yearNode != null && yearNode.isInt()) {
                            year = yearNode.intValue();
                        }

                        String imageUrl = null;
                        JsonNode coverNode = doc.get("cover_i");
                        if (coverNode != null && coverNode.isInt()) {
                            imageUrl = "https://covers.openlibrary.org/b/id/" + coverNode.intValue() + "-M.jpg";
                        }

                        Book book = Book.builder()
                                .isbn(isbn)
                                .title(truncate(title, 255))
                                .author(author)
                                .publisher(publisher)
                                .category(category)
                                .publicationYear(year)
                                .imageUrl(imageUrl)
                                .totalCopies(3)
                                .availableCopies(3)
                                .isDeleted(false)
                                .build();

                        bookRepository.save(book);

                        for (int i = 0; i < 3; i++) {
                            String copyCode = String.format("BK%03d", copyCounter++);
                            BookCopyRequest req = new BookCopyRequest();
                            req.setBookId(book.getId());
                            req.setCopyCode(copyCode);
                            req.setCondition("NEW");
                            req.setPurchaseDate(null);
                            bookCopyService.addCopy(req);
                        }

                        addedForCategory++;
                    }

                    Thread.sleep(200);

                } catch (Exception e) {
                }
            }
        }
    }

    private String extractValidIsbn(JsonNode doc) {
        JsonNode isbnNode = doc.get("isbn");
        if (isbnNode != null && isbnNode.isArray()) {
            for (JsonNode node : isbnNode) {
                String val = node.asText().replaceAll("[^0-9Xx]", "").trim();
                if (val.length() >= 10 && val.length() <= 20) {
                    return val;
                }
            }
        }
        return null;
    }

    private String getFirstArrayValue(JsonNode doc, String field) {
        JsonNode node = doc.get(field);
        if (node == null || !node.isArray() || node.size() == 0) {
            return null;
        }
        return node.get(0).asText();
    }

    private String getText(JsonNode doc, String field) {
        JsonNode node = doc.get(field);
        if (node == null || node.isNull()) {
            return null;
        }
        return node.asText();
    }

    private Author ensureAuthor(String name) {
        String authorName = (name == null || name.isBlank()) ? "Unknown Author" : name;
        return authorRepository.findByNameIgnoreCase(authorName)
                .orElseGet(() -> authorRepository.save(Author.builder().name(truncate(authorName, 150)).build()));
    }

    private Publisher ensurePublisher(String name) {
        String publisherName = (name == null || name.isBlank()) ? "Unknown Publisher" : name;
        return publisherRepository.findByNameIgnoreCase(publisherName)
                .orElseGet(() -> publisherRepository.save(Publisher.builder().name(truncate(publisherName, 150)).build()));
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }
}
