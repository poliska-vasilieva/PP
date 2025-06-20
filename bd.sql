PGDMP  '    /                }         
   doctorword    17.5    17.5 /    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16643 
   doctorword    DATABASE     ~   CREATE DATABASE doctorword WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Russian_Russia.1251';
    DROP DATABASE doctorword;
                     postgres    false            Z           1247    16652    enum_Users_group    TYPE     a   CREATE TYPE public."enum_Users_group" AS ENUM (
    '22Л-11',
    '21к-01',
    '22ф-02б'
);
 %   DROP TYPE public."enum_Users_group";
       public               postgres    false            W           1247    16645    enum_Users_role    TYPE     \   CREATE TYPE public."enum_Users_role" AS ENUM (
    'student',
    'teacher',
    'admin'
);
 $   DROP TYPE public."enum_Users_role";
       public               postgres    false            �            1259    16706    Articles    TABLE     
  CREATE TABLE public."Articles" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    image character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);
    DROP TABLE public."Articles";
       public         heap r       postgres    false            �            1259    16705    Articles_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Articles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public."Articles_id_seq";
       public               postgres    false    224            �           0    0    Articles_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public."Articles_id_seq" OWNED BY public."Articles".id;
          public               postgres    false    223            �            1259    16687    Cards    TABLE     ,  CREATE TABLE public."Cards" (
    id integer NOT NULL,
    word character varying(255) NOT NULL,
    translation character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "UserId" integer,
    "CollectionId" integer
);
    DROP TABLE public."Cards";
       public         heap r       postgres    false            �            1259    16686    Cards_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Cards_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public."Cards_id_seq";
       public               postgres    false    222            �           0    0    Cards_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public."Cards_id_seq" OWNED BY public."Cards".id;
          public               postgres    false    221            �            1259    16672    Collections    TABLE     8  CREATE TABLE public."Collections" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    "isPublic" boolean DEFAULT false,
    "userId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "UserId" integer
);
 !   DROP TABLE public."Collections";
       public         heap r       postgres    false            �            1259    16671    Collections_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Collections_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public."Collections_id_seq";
       public               postgres    false    220            �           0    0    Collections_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public."Collections_id_seq" OWNED BY public."Collections".id;
          public               postgres    false    219            �            1259    16715    TestResults    TABLE     G  CREATE TABLE public."TestResults" (
    id integer NOT NULL,
    "correctCount" integer NOT NULL,
    "incorrectCount" integer NOT NULL,
    "incorrectWords" json NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "UserId" integer,
    "CollectionId" integer
);
 !   DROP TABLE public."TestResults";
       public         heap r       postgres    false            �            1259    16714    TestResults_id_seq    SEQUENCE     �   CREATE SEQUENCE public."TestResults_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public."TestResults_id_seq";
       public               postgres    false    226            �           0    0    TestResults_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public."TestResults_id_seq" OWNED BY public."TestResults".id;
          public               postgres    false    225            �            1259    16660    Users    TABLE     �  CREATE TABLE public."Users" (
    id integer NOT NULL,
    nickname character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public."enum_Users_role" DEFAULT 'student'::public."enum_Users_role" NOT NULL,
    "group" public."enum_Users_group",
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);
    DROP TABLE public."Users";
       public         heap r       postgres    false    855    858    855            �            1259    16659    Users_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public."Users_id_seq";
       public               postgres    false    218            �           0    0    Users_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;
          public               postgres    false    217            @           2604    16709    Articles id    DEFAULT     n   ALTER TABLE ONLY public."Articles" ALTER COLUMN id SET DEFAULT nextval('public."Articles_id_seq"'::regclass);
 <   ALTER TABLE public."Articles" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    223    224            ?           2604    16690    Cards id    DEFAULT     h   ALTER TABLE ONLY public."Cards" ALTER COLUMN id SET DEFAULT nextval('public."Cards_id_seq"'::regclass);
 9   ALTER TABLE public."Cards" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    221    222    222            =           2604    16675    Collections id    DEFAULT     t   ALTER TABLE ONLY public."Collections" ALTER COLUMN id SET DEFAULT nextval('public."Collections_id_seq"'::regclass);
 ?   ALTER TABLE public."Collections" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    219    220    220            A           2604    16718    TestResults id    DEFAULT     t   ALTER TABLE ONLY public."TestResults" ALTER COLUMN id SET DEFAULT nextval('public."TestResults_id_seq"'::regclass);
 ?   ALTER TABLE public."TestResults" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    225    226    226            ;           2604    16663    Users id    DEFAULT     h   ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);
 9   ALTER TABLE public."Users" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    217    218    218            �          0    16706    Articles 
   TABLE DATA           Y   COPY public."Articles" (id, title, content, image, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    224   :       �          0    16687    Cards 
   TABLE DATA           l   COPY public."Cards" (id, word, translation, "createdAt", "updatedAt", "UserId", "CollectionId") FROM stdin;
    public               postgres    false    222    :       �          0    16672    Collections 
   TABLE DATA           y   COPY public."Collections" (id, title, description, "isPublic", "userId", "createdAt", "updatedAt", "UserId") FROM stdin;
    public               postgres    false    220   =:       �          0    16715    TestResults 
   TABLE DATA           �   COPY public."TestResults" (id, "correctCount", "incorrectCount", "incorrectWords", "createdAt", "updatedAt", "UserId", "CollectionId") FROM stdin;
    public               postgres    false    226   Z:       �          0    16660    Users 
   TABLE DATA           i   COPY public."Users" (id, nickname, email, password, role, "group", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    218   w:       �           0    0    Articles_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public."Articles_id_seq"', 1, false);
          public               postgres    false    223            �           0    0    Cards_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public."Cards_id_seq"', 1, false);
          public               postgres    false    221            �           0    0    Collections_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public."Collections_id_seq"', 1, false);
          public               postgres    false    219            �           0    0    TestResults_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public."TestResults_id_seq"', 1, false);
          public               postgres    false    225            �           0    0    Users_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public."Users_id_seq"', 3, true);
          public               postgres    false    217            K           2606    16713    Articles Articles_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."Articles"
    ADD CONSTRAINT "Articles_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."Articles" DROP CONSTRAINT "Articles_pkey";
       public                 postgres    false    224            I           2606    16694    Cards Cards_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public."Cards"
    ADD CONSTRAINT "Cards_pkey" PRIMARY KEY (id);
 >   ALTER TABLE ONLY public."Cards" DROP CONSTRAINT "Cards_pkey";
       public                 postgres    false    222            G           2606    16680    Collections Collections_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public."Collections"
    ADD CONSTRAINT "Collections_pkey" PRIMARY KEY (id);
 J   ALTER TABLE ONLY public."Collections" DROP CONSTRAINT "Collections_pkey";
       public                 postgres    false    220            M           2606    16722    TestResults TestResults_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public."TestResults"
    ADD CONSTRAINT "TestResults_pkey" PRIMARY KEY (id);
 J   ALTER TABLE ONLY public."TestResults" DROP CONSTRAINT "TestResults_pkey";
       public                 postgres    false    226            C           2606    16670    Users Users_email_key 
   CONSTRAINT     U   ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);
 C   ALTER TABLE ONLY public."Users" DROP CONSTRAINT "Users_email_key";
       public                 postgres    false    218            E           2606    16668    Users Users_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);
 >   ALTER TABLE ONLY public."Users" DROP CONSTRAINT "Users_pkey";
       public                 postgres    false    218            O           2606    16700    Cards Cards_CollectionId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Cards"
    ADD CONSTRAINT "Cards_CollectionId_fkey" FOREIGN KEY ("CollectionId") REFERENCES public."Collections"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 K   ALTER TABLE ONLY public."Cards" DROP CONSTRAINT "Cards_CollectionId_fkey";
       public               postgres    false    222    220    4679            P           2606    16695    Cards Cards_UserId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Cards"
    ADD CONSTRAINT "Cards_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 E   ALTER TABLE ONLY public."Cards" DROP CONSTRAINT "Cards_UserId_fkey";
       public               postgres    false    222    4677    218            N           2606    16681 #   Collections Collections_UserId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Collections"
    ADD CONSTRAINT "Collections_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 Q   ALTER TABLE ONLY public."Collections" DROP CONSTRAINT "Collections_UserId_fkey";
       public               postgres    false    218    220    4677            Q           2606    16728 )   TestResults TestResults_CollectionId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."TestResults"
    ADD CONSTRAINT "TestResults_CollectionId_fkey" FOREIGN KEY ("CollectionId") REFERENCES public."Collections"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 W   ALTER TABLE ONLY public."TestResults" DROP CONSTRAINT "TestResults_CollectionId_fkey";
       public               postgres    false    220    4679    226            R           2606    16723 #   TestResults TestResults_UserId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."TestResults"
    ADD CONSTRAINT "TestResults_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 Q   ALTER TABLE ONLY public."TestResults" DROP CONSTRAINT "TestResults_UserId_fkey";
       public               postgres    false    218    4677    226            �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �     x�3�0�{.츰����.6\�p��¾�
B�.l���b7gbJnf�CjEbnAN�^r~.��Q�����s�G�[x��O��WQvv�qU��[j�Q@Ef�Ei�o�oZ���gpz�e�qD�A��{��8�?N##S]3]CC+cK+c3=#3CmS<R\F�6��
řX���͍�A~�UQ�y�Q~�e�&fi!N%����������AN��n9�~���9�y���^>����%�)�y%�FFf��������@���ө�R\1z\\\ �J{�     